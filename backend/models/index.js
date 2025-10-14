const User = require('./User');
const RaffleDraw = require('./RaffleDraw');
const Prize = require('./Prize');
const Participant = require('./Participant');

// Define associations
User.hasMany(RaffleDraw, { foreignKey: 'userId', as: 'raffleDraws' });
RaffleDraw.belongsTo(User, { foreignKey: 'userId', as: 'user' });

RaffleDraw.hasMany(Prize, { foreignKey: 'raffleDrawId', as: 'prizes' });
Prize.belongsTo(RaffleDraw, { foreignKey: 'raffleDrawId', as: 'raffleDraw' });

RaffleDraw.hasMany(Participant, { foreignKey: 'raffleDrawId', as: 'participants' });
Participant.belongsTo(RaffleDraw, { foreignKey: 'raffleDrawId', as: 'raffleDraw' });

Prize.belongsTo(Participant, { foreignKey: 'winnerId', as: 'winner' });
Participant.hasOne(Prize, { foreignKey: 'winnerId', as: 'wonPrize' });

module.exports = {
  User,
  RaffleDraw,
  Prize,
  Participant
};
