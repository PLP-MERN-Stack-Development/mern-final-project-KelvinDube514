const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const logger = require('../config/logger');

const execAsync = util.promisify(exec);

/**
 * Database Utilities for MongoDB backup, monitoring, and maintenance
 */
class DatabaseUtils {
  constructor() {
    this.backupDir = process.env.BACKUP_PATH || path.join(__dirname, '../../backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.backupDir, { recursive: true });
        logger.info('Backup directory created:', this.backupDir);
      }
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(options = {}) {
    const { 
      includeCollections = ['incidents', 'users', 'alerts', 'locations'],
      format = 'json',
      compress = true 
    } = options;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `securepath_backup_${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      // Ensure backup directory exists
      await this.ensureBackupDirectory();
      await fs.mkdir(backupPath, { recursive: true });

      // Get MongoDB connection details
      const mongoUri = process.env.MONGODB_URI;
      const dbName = this.extractDbNameFromUri(mongoUri);

      const backupResults = {
        timestamp: new Date(),
        backupName,
        backupPath,
        collections: {},
        totalDocuments: 0,
        size: 0,
        success: false
      };

      // Backup each collection
      for (const collectionName of includeCollections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          const documents = await collection.find({}).toArray();
          
          if (documents.length > 0) {
            const collectionFile = path.join(backupPath, `${collectionName}.json`);
            await fs.writeFile(collectionFile, JSON.stringify(documents, null, 2));
            
            const stats = await fs.stat(collectionFile);
            backupResults.collections[collectionName] = {
              documents: documents.length,
              size: stats.size,
              file: collectionFile
            };
            backupResults.totalDocuments += documents.length;
            backupResults.size += stats.size;
            
            logger.info(`Backed up ${collectionName}: ${documents.length} documents`);
          } else {
            logger.warn(`Collection ${collectionName} is empty, skipping backup`);
            backupResults.collections[collectionName] = {
              documents: 0,
              size: 0,
              file: null
            };
          }
        } catch (error) {
          logger.error(`Error backing up collection ${collectionName}:`, error);
          backupResults.collections[collectionName] = {
            error: error.message
          };
        }
      }

      // Create backup metadata
      const metadataFile = path.join(backupPath, 'metadata.json');
      await fs.writeFile(metadataFile, JSON.stringify(backupResults, null, 2));

      // Compress backup if requested
      if (compress) {
        try {
          const archiveName = `${backupName}.tar.gz`;
          const archivePath = path.join(this.backupDir, archiveName);
          
          await execAsync(`tar -czf "${archivePath}" -C "${this.backupDir}" "${backupName}"`);
          
          // Remove uncompressed backup directory
          await fs.rmdir(backupPath, { recursive: true });
          
          const archiveStats = await fs.stat(archivePath);
          backupResults.compressed = true;
          backupResults.archivePath = archivePath;
          backupResults.compressedSize = archiveStats.size;
          backupResults.compressionRatio = Math.round((1 - archiveStats.size / backupResults.size) * 100);
          
          logger.info(`Backup compressed: ${archiveName} (${Math.round(archiveStats.size / 1024)}KB, ${backupResults.compressionRatio}% compression)`);
        } catch (error) {
          logger.warn('Compression failed, keeping uncompressed backup:', error.message);
        }
      }

      backupResults.success = true;
      logger.info('Database backup completed successfully:', backupName);
      
      return backupResults;
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath, options = {}) {
    const { 
      collections = null, // null means restore all
      dropExisting = false 
    } = options;

    try {
      // Extract compressed backup if needed
      let extractedPath = backupPath;
      if (backupPath.endsWith('.tar.gz')) {
        const extractDir = path.join(this.backupDir, 'temp_restore');
        await fs.mkdir(extractDir, { recursive: true });
        
        await execAsync(`tar -xzf "${backupPath}" -C "${extractDir}"`);
        
        // Find the extracted backup directory
        const extractedContents = await fs.readdir(extractDir);
        extractedPath = path.join(extractDir, extractedContents[0]);
      }

      // Read metadata
      const metadataFile = path.join(extractedPath, 'metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf8'));

      const restoreResults = {
        timestamp: new Date(),
        backupTimestamp: metadata.timestamp,
        collections: {},
        totalDocuments: 0,
        success: false
      };

      // Get collections to restore
      const collectionsToRestore = collections || Object.keys(metadata.collections);

      for (const collectionName of collectionsToRestore) {
        try {
          const collectionFile = path.join(extractedPath, `${collectionName}.json`);
          
          // Check if collection file exists
          await fs.access(collectionFile);
          
          // Read collection data
          const documents = JSON.parse(await fs.readFile(collectionFile, 'utf8'));
          
          if (documents.length > 0) {
            const collection = mongoose.connection.db.collection(collectionName);
            
            // Drop existing collection if requested
            if (dropExisting) {
              try {
                await collection.drop();
                logger.info(`Dropped existing collection: ${collectionName}`);
              } catch (error) {
                // Collection might not exist, which is fine
                if (error.code !== 26) { // NamespaceNotFound
                  throw error;
                }
              }
            }

            // Insert documents
            const result = await collection.insertMany(documents, { ordered: false });
            
            restoreResults.collections[collectionName] = {
              documents: result.insertedCount,
              success: true
            };
            restoreResults.totalDocuments += result.insertedCount;
            
            logger.info(`Restored ${collectionName}: ${result.insertedCount} documents`);
          } else {
            restoreResults.collections[collectionName] = {
              documents: 0,
              success: true
            };
          }
        } catch (error) {
          logger.error(`Error restoring collection ${collectionName}:`, error);
          restoreResults.collections[collectionName] = {
            error: error.message,
            success: false
          };
        }
      }

      // Cleanup temporary extraction directory if used
      if (backupPath.endsWith('.tar.gz')) {
        const tempDir = path.dirname(extractedPath);
        await fs.rmdir(tempDir, { recursive: true });
      }

      restoreResults.success = Object.values(restoreResults.collections)
        .every(col => col.success !== false);

      logger.info('Database restore completed:', restoreResults);
      return restoreResults;
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    try {
      const status = {
        timestamp: new Date(),
        connection: {
          state: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        },
        collections: {},
        indexes: {},
        performance: {},
        storage: {}
      };

      // Connection state mapping
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      status.connection.stateText = stateMap[status.connection.state];

      // Collection statistics
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          const stats = await collection.stats();
          const indexInfo = await collection.listIndexes().toArray();

          status.collections[collectionName] = {
            documents: stats.count,
            size: stats.size,
            avgDocSize: Math.round(stats.avgObjSize || 0),
            indexes: indexInfo.length,
            storageSize: stats.storageSize
          };

          status.indexes[collectionName] = indexInfo.map(idx => ({
            name: idx.name,
            keys: idx.key,
            unique: idx.unique || false
          }));
        } catch (error) {
          status.collections[collectionName] = {
            error: error.message
          };
        }
      }

      // Database statistics
      try {
        const dbStats = await mongoose.connection.db.stats();
        status.storage = {
          totalSize: dbStats.dataSize + dbStats.indexSize,
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize,
          storageSize: dbStats.storageSize,
          avgDocSize: Math.round(dbStats.avgObjSize || 0)
        };
      } catch (error) {
        status.storage.error = error.message;
      }

      // Performance metrics
      status.performance = {
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };

      return status;
    } catch (error) {
      logger.error('Health check failed:', error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Cleanup old backups
   */
  async cleanupOldBackups(retentionDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const backupFiles = await fs.readdir(this.backupDir);
      const deletedFiles = [];

      for (const file of backupFiles) {
        if (file.startsWith('securepath_backup_')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            if (stats.isDirectory()) {
              await fs.rmdir(filePath, { recursive: true });
            } else {
              await fs.unlink(filePath);
            }
            deletedFiles.push(file);
            logger.info(`Deleted old backup: ${file}`);
          }
        }
      }

      return {
        deletedCount: deletedFiles.length,
        deletedFiles,
        retentionDays,
        cleanupDate: new Date()
      };
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of backupFiles) {
        if (file.startsWith('securepath_backup_')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          let metadata = null;
          try {
            if (file.endsWith('.tar.gz')) {
              // For compressed backups, we'd need to extract to read metadata
              // For now, just provide basic info
              metadata = {
                compressed: true,
                size: stats.size
              };
            } else if (stats.isDirectory()) {
              const metadataFile = path.join(filePath, 'metadata.json');
              const metadataContent = await fs.readFile(metadataFile, 'utf8');
              metadata = JSON.parse(metadataContent);
            }
          } catch (error) {
            logger.warn(`Could not read metadata for ${file}:`, error.message);
          }

          backups.push({
            name: file,
            path: filePath,
            created: stats.mtime,
            size: stats.size,
            isDirectory: stats.isDirectory(),
            metadata
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created) - new Date(a.created));

      return backups;
    } catch (error) {
      logger.error('List backups failed:', error);
      throw new Error(`List backups failed: ${error.message}`);
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(collectionName, options = {}) {
    const { 
      query = {}, 
      fields = null, 
      filename = null 
    } = options;

    try {
      const collection = mongoose.connection.db.collection(collectionName);
      const documents = await collection.find(query).toArray();

      if (documents.length === 0) {
        throw new Error(`No documents found in collection ${collectionName}`);
      }

      // Get field names
      const fieldNames = fields || Object.keys(documents[0]);
      
      // Create CSV content
      let csvContent = fieldNames.join(',') + '\n';
      
      for (const doc of documents) {
        const row = fieldNames.map(field => {
          let value = doc[field];
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += row.join(',') + '\n';
      }

      // Save to file if filename provided
      if (filename) {
        const csvPath = path.join(this.backupDir, filename);
        await fs.writeFile(csvPath, csvContent, 'utf8');
        
        const stats = await fs.stat(csvPath);
        return {
          collection: collectionName,
          documents: documents.length,
          fields: fieldNames.length,
          file: csvPath,
          size: stats.size,
          exported: new Date()
        };
      }

      return {
        collection: collectionName,
        documents: documents.length,
        fields: fieldNames.length,
        content: csvContent,
        exported: new Date()
      };
    } catch (error) {
      logger.error(`CSV export failed for ${collectionName}:`, error);
      throw new Error(`CSV export failed: ${error.message}`);
    }
  }

  /**
   * Helper method to extract database name from MongoDB URI
   */
  extractDbNameFromUri(uri) {
    try {
      const url = new URL(uri);
      return url.pathname.slice(1); // Remove leading slash
    } catch (error) {
      return 'securepath'; // fallback
    }
  }

  /**
   * Start automated backup scheduler
   */
  startBackupScheduler(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    setInterval(async () => {
      try {
        logger.info('Starting scheduled backup...');
        const result = await this.createBackup({ compress: true });
        logger.info('Scheduled backup completed:', result.backupName);
        
        // Cleanup old backups (keep 30 days)
        await this.cleanupOldBackups(30);
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    }, intervalMs);

    logger.info(`Backup scheduler started: every ${intervalHours} hours`);
  }
}

module.exports = new DatabaseUtils();
