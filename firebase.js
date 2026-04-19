const admin = require('firebase-admin');
require('dotenv').config();
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
              } else {
                  serviceAccount = {
                        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                                        };
                                          }
                                            if (!admin.apps.length) {
                                                admin.initializeApp({
                                                      credential: admin.credential.cert(serviceAccount),
                                                            storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
                                                                });
                                                                  }
                                                                  } catch (error) {
                                                                    console.error('Firebase Admin Initialization Error:', error);
                                                                    }
                                                                    module.exports = admin;
