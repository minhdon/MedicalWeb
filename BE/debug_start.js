import './app.js';
console.log('App loaded successfully');
setTimeout(() => {
    console.log('Exiting debug script');
    process.exit(0);
}, 5000);
