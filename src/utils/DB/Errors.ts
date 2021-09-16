import { sequelize } from '.';
import { DataTypes, Model } from 'sequelize';

export default class Errors extends Model {
  id: Date;
  data: string;
}

(async function () {
  Errors.init(
    {
      id: { type: DataTypes.DATE, primaryKey: true },
      data: DataTypes.STRING(10485760)
    },
    {
      sequelize
    }
  );
  try {
    await Errors.sync();
    console.log('Successfully synced Errors table!');
  } catch (err) {
    console.error('An error occurred while syncing the Errors table!', err);
  }
})();
