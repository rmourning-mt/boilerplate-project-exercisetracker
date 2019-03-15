const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }
});
userSchema.virtual('exercises', {
    ref: 'Exercise',
    localField: '_id',
    foreignField: 'user'
});
const User = mongoose.model('User', userSchema);

const Exercise = mongoose.model('Exercise', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    duration: { type: Number, required: true, min: [0, 'duration cannot be negative.'] },
    date: { type: Date, required: true }
}));

function createUser(username, done) {
    if (!username) {
        done(new StatusError(400, 'username is required.'));
    } else {
        checkUniqueUsername(username, (err, unique) => {
            if (err) {
                done(err);
            } else if (!unique) {
                done(new StatusError(400, 'username is already taken.'));
            } else {
                new User({
                    username: username
                }).save(done);
            }
        });
    }
}

function getUserList(done) {
    User.find({}, 'username _id', done);
}

function createExercise(userId, description, duration, date, done) {
    var objId = parseObjectId(userId);
    if (!objId) {
        done(new StatusError(400, 'missing or invalid userId.'));
        return;
    }
    User.findById(objId, 'username _id', (err, user) => {
        if (err) {
            done(err);
        } else if (!user) {
            done(new StatusError(400, 'userId not found.'));
        } else {
            new Exercise({
                user: user,
                description: description,
                duration: duration,
                date: date || new Date()
            }).save((err, exercise) => {
                if (err) {
                    done(err);
                } else {
                    done(null, exercise);
                }
            });
        }
    });
}

function getExerciseList(userId, done) {
    var objId = parseObjectId(userId);
    if (!objId) {
        done(new StatusError(400, 'missing or invalid userId.'));
        return;
    }
    User.findById(objId).populate('exercises').exec(done);
}

function checkUniqueUsername(username, done) {
    User.countDocuments({ username: username }, (err, count) => {
        if (err) {
            done(err);
        } else {
            done(null, count === 0);
        }
    });
}

function parseObjectId(value) {
    try {
        return mongoose.Types.ObjectId(value);
    } catch (ex) {
        return null;
    }
}

function StatusError(status, message) {
    this.status = status;
    this.message = message;
}

module.exports = {
    user: {
        create: createUser,
        list: getUserList
    },
    exercise: {
        create: createExercise,
        list: getExerciseList
    }
};
