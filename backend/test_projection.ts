import mongoose from "mongoose";
import { User } from "./src/models/User";
import { USER_PROJECTION } from "./src/lib/helpers";

async function root() {
    await mongoose.connect("mongodb://127.0.0.1:27017/brainboard");
    // ensure there's at least one user
    let user = await User.findOne();
    if (!user) {
        user = await User.create({ name: 'test', email: 'test@t.com', password: 'asd' });
    }

    const users = await User.find({}).select(USER_PROJECTION).lean();
    console.log('Raw users from lean():', JSON.stringify(users, null, 2));

    const serializedUsers = users.map(u => ({
        ...u,
        id: (u as any)._id?.toString(),
        _id: undefined
    }));
    console.log('Serialized users:', JSON.stringify(serializedUsers, null, 2));
    process.exit(0);
}
root();
