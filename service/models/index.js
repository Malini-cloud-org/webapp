
import User from './User.js';
import Image from './Image.js';


//One to one relationship
User.hasOne(Image, { foreignKey: 'user_id' });
Image.belongsTo(User, { foreignKey: 'user_id' });


// Sync models in the correct order
export async function syncModels() {
    try {
        await User.sync(); // First sync User table
        console.log('User table created successfully.');
        await Image.sync(); // Then sync Image table with FK dependency on User
        console.log('Image table created successfully.');
      } catch (error) {
        console.error('Error syncing tables:', error);
      }
}

