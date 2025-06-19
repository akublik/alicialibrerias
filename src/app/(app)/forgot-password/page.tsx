// This page's functionality has been moved to /auth/forgot-password.
// This file is modified to prevent routing conflicts.
// It should not export a default React component to be treated as a page.

const message = "This page has been moved to /auth/forgot-password. Please update any links.";

// You can export a named constant or function if the file needs to export something.
export { message };

// Alternatively, to be absolutely sure it's not a page, ensure no default export exists
// or that the default export is not a React component.
// For example:
// export default null;
// or simply having no default export as above.
