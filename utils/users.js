


const users = [];//list of dictionaries with value of username, room, id.
//apply any of these logic to get the data from a database

// Join user to chat
export function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  //adds to the list of users, so we can then get the data for other things in the other functions
  return user;
}

// Get current user
export function getCurrentUser(id) {
  return users.find(user => user.id === id);
  //return the current user via id (use when the user is sending messages)
}

// User leaves chat
export function userLeave(id) {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
    //deletes one element with the user index
  }
}

// Get room users
export function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

// You can export the functions individually or as a single object if needed.
