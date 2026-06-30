export const authConfig = {
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  logoutUri: `${window.location.origin}`,
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN,
};

// used in LoginToggleButton.jsx and ExplorerTopBar to remove user client side and cognito server side.
export const logout = (auth) => {
  // Clear local user data first
  auth.removeUser();

  // Then redirect to Cognito logout to end server session
  const logoutUrl = `${authConfig.cognitoDomain}/logout?client_id=${authConfig.clientId}&logout_uri=${encodeURIComponent(authConfig.logoutUri)}`;
  window.location.href = logoutUrl;
};

// used in LoginToggleButton.jsx and ExplorerTopBar to redirect to cognito login
export const login = (auth) => {
  auth.signinRedirect();
};

// used in LoginToggleButton.jsx and ExplorerTopBar to check loading state
export const isLoading = (auth) => {
  return auth.isLoading;
};

// check if user is authenticated
export const isAuthenticated = (auth) => {
  return auth.isAuthenticated && !auth.isLoading;
};

// get user profile
export const getUserProfile = (auth) => {
  return auth.user?.profile || null;
};

export const isAdminUser = (profile) => {
  if (!profile) {
    return false;
  }

  const groups = profile["cognito:groups"];
  const normalizedGroups = Array.isArray(groups)
    ? groups
    : typeof groups === "string"
      ? [groups]
      : [];

  return (
    profile.role === "admin" ||
    profile["custom:role"] === "admin" ||
    normalizedGroups.includes("admin")
  );
};

export const isAdminPreviewEnabled = () => {
  const previewFlag = import.meta.env.VITE_ENABLE_ADMIN_PREVIEW;

  if (typeof previewFlag === "string") {
    return previewFlag.toLowerCase() === "true";
  }

  return import.meta.env.DEV;
};


// authHelper should only deal with authentication-related tasks, not DB.
// This is what is would look like if we added a user to DB here though.
// backend endpoint call - add user to mongo

// export const syncUserToBackend = async (auth) => {
//   if (!auth.isAuthenticated || !auth.user) {
//     return;
//   }

//   try {

//     // AWS users do not have a first and last name attached, we will store that info ourselves.
//     // at the very least, store the cognito id and email info.
//     //may need a second page on first login/signup to get first name, last name, and link to an admin.

//     //ex, check if they have logged in before, if not then send to complete profile page

//     const userData = {
//       cognitoId: auth.user.profile.sub,
//       email: auth.user.profile.email,
//       name: auth.user.profile.name || auth.user.profile.given_name,
//       emailVerified: auth.user.profile.email_verified,
//     };

//     // TODO: replace with actual endpoint
//     const response = await fetch('/notOurAcutalAPI/endpoint/syncUserWithMongo', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${auth.user.access_token}`
//       },
//       body: JSON.stringify(userData)
//     });

//     if (!response.ok) {
//       throw new Error('Failed to sync user');
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error syncing user to MongoDB:', error);
//     throw error;
//   }
// };

// // end backend api call

// // sample functions for user management in the future
// export const getUser = async (auth) => {
//   if (!auth.isAuthenticated || !auth.user) {
//     return;
//   }
//     try {

//     } catch (error) {

//     }
// }

// export const modifyUser = async (auth) => {
//   if (!auth.isAuthenticated || !auth.user) {
//     return;
//   }
//     try {

//     } catch (error) {

//     }
// }
