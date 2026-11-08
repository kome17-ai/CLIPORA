/*
  Clipora site settings. Edit the values below, no other file needs to change.
*/
window.CLIPORA_CONFIG = {
  // Option A: Firebase Realtime Database URL (saves waitlist emails under /waitlist).
  // Example: "https://your-project-default-rtdb.firebaseio.com"
  // Then publish firebase/database.rules.json in the Firebase console.
  firebaseDbUrl: "https://jeko-b63b0-default-rtdb.firebaseio.com",

  // Option B: any form endpoint that accepts a JSON POST (Formspree, Google Apps Script, ...).
  waitlistEndpoint: "",

  // Optional: path or URL of the video that plays in the floating phone.
  // Leave empty to use assets/video/hero.mp4 when that file exists.
  heroVideo: ""
};
