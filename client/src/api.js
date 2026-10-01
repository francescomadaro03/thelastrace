const APIURL = 'http://localhost:3001/api';

export const getNetwork = async () => {
  try {
    const response = await fetch(`${APIURL}/network`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Error fetching network: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getEvents = async (numStations) => {
  try {
    const url = numStations ? `${APIURL}/events?numStations=${numStations}` : `${APIURL}/events`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ numStations }),
      credentials: 'include'
    }
    );
    if (!response.ok) {
      throw new Error(`Error fetching events: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching events', error);
    throw error;
  }
};

export const logIn = async (username, password) => {
  try {
    const response = await fetch(`${APIURL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Login failed');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in', error);
    throw error;
  }
};

export const getLeaderboard = async () => {
  try {
    const response = await fetch(`${APIURL}/games`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard', error);
    throw error;
  }
};

export const setupGame = async () => {
  try {
    const response = await fetch(`${APIURL}/games/setup`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to setup game');
    }
    return await response.json();
  } catch (error) {
    console.error('Error setting up game', error);
    throw error;
  }
};

export const validateGame = async (segments, startTimestamp, endTimestamp) => {
  try {
    const response = await fetch(`${APIURL}/games/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segments, startTimestamp, endTimestamp }),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to validate route');
    }
    return data;
  } catch (error) {
    console.error('Error validating game', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    const response = await fetch(`${APIURL}/sessions/current`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Logout failed');
    }
  } catch (error) {
    console.error('Error logging out', error);
    throw error;
  }
};

export const getCurrentSession = async () => {
  try {
    const response = await fetch(`${APIURL}/sessions/current`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

