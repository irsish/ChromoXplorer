// Runs once when MongoDB starts with an empty data directory.
// Creates the backend service user with readWrite access to the app database.

const backendUser = process.env.MONGO_BACKEND_USER;
const backendPassword = process.env.MONGO_BACKEND_PASSWORD;

db = db.getSiblingDB('chromoxplorer');
db.createUser({
  user: backendUser,
  pwd: backendPassword,
  roles: [{ role: 'readWrite', db: 'chromoxplorer' }]
});
print('Created backend user: ' + backendUser);
