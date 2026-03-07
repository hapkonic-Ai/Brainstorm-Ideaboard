import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
const Model = mongoose.model('Test', schema);

const doc = new Model({ members: [new mongoose.Types.ObjectId('60d5ecb8b392d70f00000000')] });

console.log('includes string:', doc.members.includes('60d5ecb8b392d70f00000000' as any));
console.log('includes ObjectId same ref:', doc.members.includes(doc.members[0]));
console.log('includes ObjectId different ref:', doc.members.includes(new mongoose.Types.ObjectId('60d5ecb8b392d70f00000000')));

console.log('some:', doc.members.some(id => id.toString() === '60d5ecb8b392d70f00000000'));
