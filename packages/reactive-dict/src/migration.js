import { ReactiveDict } from './reactive-dict';

// if (Meteor.isClient && Package.reload) {
//   // Put old migrated data into ReactiveDict._migratedDictData,
//   // where it can be accessed by ReactiveDict._loadMigratedDict.
//   const migrationData = Package.reload.Reload._migrationData('reactive-dict');
//   if (migrationData && migrationData.dicts) { ReactiveDict._migratedDictData = migrationData.dicts; }

//   // On migration, assemble the data from all the dicts that have been
//   // registered.
//   Package.reload.Reload._onMigrate('reactive-dict', () => {
//     const dictsToMigrate = ReactiveDict._dictsToMigrate;
//     const dataToMigrate = {};

//     for (const dictName in dictsToMigrate) { dataToMigrate[dictName] = dictsToMigrate[dictName]._getMigrationData(); }

//     return [true, { dicts: dataToMigrate }];
//   });
// }

export { ReactiveDict };
