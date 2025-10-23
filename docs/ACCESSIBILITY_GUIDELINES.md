# Accessibility Guidelines

## Overview

This document outlines the accessibility standards and best practices for the Community Safe Path application. We aim to meet **WCAG 2.1 Level AA** compliance to ensure our application is usable by everyone, including people with disabilities.

---

## Table of Contents

1. [Accessibility Standards](#accessibility-standards)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Visual Design](#visual-design)
5. [Forms and Inputs](#forms-and-inputs)
6. [Interactive Elements](#interactive-elements)
7. [Media and Content](#media-and-content)
8. [Testing Guidelines](#testing-guidelines)
9. [Common Issues and Solutions](#common-issues-and-solutions)

---

## Accessibility Standards

### WCAG 2.1 Level AA Requirements

We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA, which includes:

#### Perceivable
- Provide text alternatives for non-text content
- Provide captions and alternatives for multimedia
- Create content that can be presented in different ways
- Make it easier for users to see and hear content

#### Operable
- Make all functionality available from a keyboard
- Give users enough time to read and use content
- Do not use content that causes seizures
- Help users navigate and find content

#### Understandable
- Make text readable and understandable
- Make content appear and operate in predictable ways
- Help users avoid and correct mistakes

#### Robust
- Maximize compatibility with current and future tools

---

## Keyboard Navigation

### Requirements

All interactive elements must be keyboard accessible:

```typescript
// ✅ Good: Proper keyboard handling
<button 
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Submit
</button>

// ❌ Bad: Only mouse events
<div onClick={handleClick}>Submit</div>
```

### Tab Order

Ensure logical tab order:

```tsx
// Use tabIndex appropriately
<input tabIndex={0} /> {/* Normal tab order */}
<button tabIndex={-1}> {/* Programmatically focusable, not in tab order */}
<div tabIndex={0}> {/* Makes non-interactive element focusable */}
```

### Focus Management

```typescript
// Focus trap in modals
import { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Focus first element in modal
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (firstFocusable as HTMLElement)?.focus();
      
      // Trap focus
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          // Implement focus trap logic
        }
      };
      
      document.addEventListener('keydown', handleTab);
      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);
  
  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  );
}
```

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Close modal/dialog | Escape |
| Submit form | Enter |
| Navigate menu | Arrow keys |
| Select item | Space or Enter |
| Navigate tabs | Arrow keys |

---

## Screen Reader Support

### Semantic HTML

Use semantic HTML elements:

```tsx
// ✅ Good: Semantic HTML
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

<footer>
  <p>Copyright 2024</p>
</footer>

// ❌ Bad: Generic divs
<div class="nav">
  <div class="link">Home</div>
</div>
```

### ARIA Attributes

Use ARIA attributes when semantic HTML isn't sufficient:

```tsx
// ARIA roles
<div role="navigation">
<div role="main">
<div role="complementary">
<div role="contentinfo">

// ARIA labels
<button aria-label="Close dialog">×</button>
<input aria-label="Search" type="search" />

// ARIA described by
<input 
  aria-describedby="password-requirements"
  type="password"
/>
<div id="password-requirements">
  Password must be at least 8 characters
</div>

// ARIA live regions
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// ARIA expanded
<button 
  aria-expanded={isOpen}
  aria-controls="menu"
>
  Menu
</button>
```

### Heading Hierarchy

Maintain proper heading structure:

```tsx
// ✅ Good: Proper hierarchy
<h1>Page Title</h1>
  <h2>Section 1</h2>
    <h3>Subsection 1.1</h3>
    <h3>Subsection 1.2</h3>
  <h2>Section 2</h2>

// ❌ Bad: Skipping levels
<h1>Page Title</h1>
  <h3>Section</h3> {/* Skipped h2 */}
```

### Landmarks

Use landmark regions:

```tsx
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    {/* Navigation items */}
  </nav>
</header>

<main role="main">
  {/* Main content */}
</main>

<aside role="complementary" aria-label="Related information">
  {/* Sidebar content */}
</aside>

<footer role="contentinfo">
  {/* Footer content */}
</footer>
```

---

## Visual Design

### Color Contrast

Ensure sufficient color contrast:

- **Normal text**: 4.5:1 minimum
- **Large text** (18pt+): 3:1 minimum
- **UI components**: 3:1 minimum

```css
/* ✅ Good: High contrast */
.text {
  color: #000000; /* Black */
  background: #FFFFFF; /* White */
  /* Contrast ratio: 21:1 */
}

/* ❌ Bad: Low contrast */
.text {
  color: #999999; /* Light gray */
  background: #CCCCCC; /* Lighter gray */
  /* Contrast ratio: 2.8:1 - Fails WCAG AA */
}
```

### Focus Indicators

Always show visible focus indicators:

```css
/* ✅ Good: Visible focus */
button:focus {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

/* ❌ Bad: Removing focus */
button:focus {
  outline: none; /* Never do this without alternative */
}

/* ✅ Good alternative: Custom focus style */
button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.5);
}
```

### Color Independence

Don't rely solely on color:

```tsx
// ✅ Good: Color + icon + text
<div className="status-success">
  <CheckIcon aria-hidden="true" />
  <span>Success</span>
</div>

// ❌ Bad: Color only
<div className="green-text">Success</div>
```

### Text Sizing

Support text resizing up to 200%:

```css
/* Use relative units */
body {
  font-size: 16px; /* Base size */
}

h1 {
  font-size: 2rem; /* 32px, scales with base */
}

p {
  font-size: 1rem; /* 16px, scales with base */
}
```

---

## Forms and Inputs

### Labels

Always provide labels for inputs:

```tsx
// ✅ Good: Explicit label
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// ✅ Good: Implicit label
<label>
  Email Address
  <input type="email" />
</label>

// ✅ Good: ARIA label
<input 
  type="search" 
  aria-label="Search incidents"
  placeholder="Search..."
/>

// ❌ Bad: No label
<input type="email" placeholder="Email" />
```

### Required Fields

Indicate required fields:

```tsx
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<input 
  id="name" 
  type="text" 
  required 
  aria-required="true"
/>
```

### Error Messages

Associate errors with fields:

```tsx
<label htmlFor="email">Email</label>
<input 
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <div id="email-error" role="alert">
    Please enter a valid email address
  </div>
)}
```

### Form Validation

Provide clear validation feedback:

```tsx
function FormField({ error, ...props }) {
  return (
    <div>
      <label htmlFor={props.id}>{props.label}</label>
      <input
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      {error && (
        <div 
          id={`${props.id}-error`}
          role="alert"
          className="error-message"
        >
          {error}
        </div>
      )}
    </div>
  );
}
```

---

## Interactive Elements

### Buttons

Make buttons accessible:

```tsx
// ✅ Good: Semantic button
<button onClick={handleClick}>
  Submit
</button>

// ✅ Good: Button with icon
<button aria-label="Delete incident">
  <TrashIcon aria-hidden="true" />
</button>

// ❌ Bad: Non-semantic button
<div onClick={handleClick}>Submit</div>
```

### Links

Provide descriptive link text:

```tsx
// ✅ Good: Descriptive text
<a href="/incidents/123">View incident details</a>

// ❌ Bad: Generic text
<a href="/incidents/123">Click here</a>

// ✅ Good: Context for screen readers
<a href="/incidents/123">
  Read more <span className="sr-only">about theft incident on Main St</span>
</a>
```

### Modals and Dialogs

Implement accessible modals:

```tsx
function Modal({ isOpen, onClose, title, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">{title}</h2>
      <div id="modal-description">
        {children}
      </div>
      <button onClick={onClose} aria-label="Close dialog">
        ×
      </button>
    </div>
  );
}
```

### Tooltips

Make tooltips accessible:

```tsx
function Tooltip({ content, children }) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  
  return (
    <div>
      <button
        aria-describedby={isVisible ? tooltipId : undefined}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </button>
      {isVisible && (
        <div id={tooltipId} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
}
```

---

## Media and Content

### Images

Provide alt text for images:

```tsx
// ✅ Good: Descriptive alt text
<img 
  src="incident.jpg" 
  alt="Broken window on Main Street storefront"
/>

// ✅ Good: Decorative image
<img 
  src="decoration.jpg" 
  alt=""
  role="presentation"
/>

// ❌ Bad: Missing alt text
<img src="incident.jpg" />
```

### Videos

Provide captions and transcripts:

```tsx
<video controls>
  <source src="video.mp4" type="video/mp4" />
  <track 
    kind="captions" 
    src="captions.vtt" 
    srclang="en" 
    label="English"
  />
</video>
```

### Icons

Handle icons properly:

```tsx
// ✅ Good: Decorative icon
<button>
  <SaveIcon aria-hidden="true" />
  Save
</button>

// ✅ Good: Meaningful icon
<button aria-label="Save">
  <SaveIcon aria-hidden="true" />
</button>

// ❌ Bad: Icon without context
<button>
  <SaveIcon />
</button>
```

---

## Testing Guidelines

### Automated Testing

Run automated accessibility tests:

```bash
# Run Playwright accessibility tests
npm run test:e2e -- e2e/accessibility.spec.ts

# Run axe-core in browser
npx @axe-core/cli https://localhost:8080
```

### Manual Testing

#### Keyboard Testing
1. Unplug mouse
2. Navigate entire site using only keyboard
3. Verify all functionality is accessible
4. Check focus indicators are visible

#### Screen Reader Testing

**Windows**: NVDA (free)
```
Download from: https://www.nvaccess.org/
```

**macOS**: VoiceOver (built-in)
```
Enable: Cmd + F5
```

**Testing checklist**:
- [ ] All content is announced
- [ ] Navigation is logical
- [ ] Forms are understandable
- [ ] Errors are announced
- [ ] Dynamic content updates are announced

#### Browser Tools

**Chrome DevTools**:
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Run accessibility audit

**axe DevTools Extension**:
1. Install extension
2. Open DevTools
3. Run axe scan

---

## Common Issues and Solutions

### Issue: Div as Button

```tsx
// ❌ Problem
<div onClick={handleClick}>Click me</div>

// ✅ Solution
<button onClick={handleClick}>Click me</button>
```

### Issue: Missing Form Labels

```tsx
// ❌ Problem
<input type="text" placeholder="Name" />

// ✅ Solution
<label htmlFor="name">Name</label>
<input id="name" type="text" />
```

### Issue: Low Color Contrast

```css
/* ❌ Problem */
.text {
  color: #767676;
  background: #ffffff;
  /* Contrast: 4.54:1 - Barely passes */
}

/* ✅ Solution */
.text {
  color: #595959;
  background: #ffffff;
  /* Contrast: 7:1 - Passes AAA */
}
```

### Issue: No Focus Indicator

```css
/* ❌ Problem */
button:focus {
  outline: none;
}

/* ✅ Solution */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### Issue: Inaccessible Modal

```tsx
// ❌ Problem
<div className="modal">
  <div className="content">{children}</div>
</div>

// ✅ Solution
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Modal Title</h2>
  <div>{children}</div>
  <button onClick={onClose}>Close</button>
</div>
```

---

## Resources

### Tools
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

### Training
- [Web Accessibility by Google](https://www.udacity.com/course/web-accessibility--ud891)
- [Deque University](https://dequeuniversity.com/)

---

## Checklist

Use this checklist for every new feature:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Error messages are clear and associated with fields
- [ ] Headings follow proper hierarchy
- [ ] ARIA attributes are used correctly
- [ ] Content is announced by screen readers
- [ ] Automated tests pass
- [ ] Manual testing completed

---

## Contact

For accessibility questions or concerns, contact the development team or file an issue on GitHub.
