const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: {type: String, required: true},
    password: { type: String, required: true },
    avatar_img: { type: String, default: "./images/profile-pic.png" },
    description: { type: String, required: true }
});

const User = mongoose.model('users', userSchema);


const feedbackSchema = new mongoose.Schema({
    username: {type: String, required: true},
    feedback: {type: String, required: true},
    rating: {type: Number, default: 0},
    restaurant: {type: String, required: true}
});

const Feedback = mongoose.model('feedback', feedbackSchema);


const commentsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true  },
    food_rating: { type: Number, default: 5 },
    service_rating: { type: Number, default: 5  },
    ambiance_rating: { type: Number, default: 5  },
    date: { type: String, default: 0 },
    comment_img: { type: String, default: 0 },
    numLike: { type: Number, default: 0 },
    numDislike: { type: Number, default: 0 },
    ownerReplyStatus: {type: Number, default: 0}
});

const Comment = mongoose.model('comments', commentsSchema);

const restoSchema = new mongoose.Schema({
    restoPic: { type: String, required: true },
    restoName: { type: String, required: true },
    restoUser: { type: String, required: true },
    description: { type: String, required: true },
    main_rating: { type: Number, default: 0 },
    overall: { type: Number, default: 5 },
    outOF: { type: String, required: true },
    star_img: { type: String, required: true },
    noOfLike: { type: Number, default: 0 },
    noOfDislike: { type: Number, default: 0 },
    restoLink: {type: String, required: true},
    numPost : {type: Number, default : 0}
});

const Resto = mongoose.model('restaurants', restoSchema);


module.exports = {
    Resto,
    User,
    Feedback, 
    Comment
};
