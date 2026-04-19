# Deployment to Render

To deploy your backend to Render, follow these steps:

1. **Push your code to GitHub**: Make sure the `backend` folder is included in your repository.
2. **Create a New Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New** -> **Web Service**.
   - Connect your GitHub repository.
   - Set the **Root Directory** to `backend`.
   - Set the **Runtime** to `Docker` (Render will automatically find the `Dockerfile`).
   - Choose a name (e.g., `resala-chat-backend`).

3. **Configure Environment Variables**:
   In the Render dashboard, go to the **Environment** tab and add the following:
   - `VITE_FIREBASE_PROJECT_ID`: (Your Project ID)
   - `VITE_FIREBASE_STORAGE_BUCKET`: (Your Storage Bucket)
   - `FIREBASE_CLIENT_EMAIL`: (From your Firebase Service Account)
   - `FIREBASE_PRIVATE_KEY`: (From your Firebase Service Account, including the BEGIN/END headers)
   - **OR** `FIREBASE_SERVICE_ACCOUNT_JSON`: (The entire contents of your service account JSON file)

4. **Update Frontend**:
   Add this to your frontend `.env` or Render environment settings for the frontend:
   - `VITE_BACKEND_URL`: `https://your-service-name.onrender.com`

5. **Firewall/CORS**:
   The current code allows all origins (`*`). For better security later, you can replace `*` in `backend/index.js` with your frontend URL.

---

### How to get Firebase Service Account JSON?
1. Go to **Firebase Console** -> **Project Settings**.
2. Go to the **Service accounts** tab.
3. Click **Generate new private key**.
4. Save the file and copy its content into your Render environment variables.
