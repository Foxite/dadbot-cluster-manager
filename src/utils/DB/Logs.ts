import { sequelize } from '.';
import { DataTypes, Model } from 'sequelize';

export default class Logs extends Model {
  id: Date;
  data: string;
}

(async function () {
  Logs.init(
    {
      id: { type: DataTypes.DATE, primaryKey: true },
      data: DataTypes.STRING(10485760)
    },
    {
      sequelize
    }
  );
  try {
    await Logs.sync();
    console.log('Successfully synced Logs table!');
  } catch (err) {
    console.error('An error occurred while syncing the Logs table!', err);
  }
})();
