const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
//
const checkObjectId = require('../../middleware/checkObjectId');
const auth = require('../../middleware/auth');
const profileAuth = require('../../middleware/profileAuth');
//
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');


// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
    '/',
    auth,
    profileAuth,
    check('text', 'Text is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })

            const newPost = new Post({
                text: req.body.text,
                name: profile.username,
                profile: profile.id
            });
            const post = await newPost.save();

            res.json(post);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get('/:id', checkObjectId('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);

        res.status(500).send('Server Error');
    }
});


// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', [auth, profileAuth, checkObjectId('id')], async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const profile = await Profile.findOne({ user: req.user.id })

        // check post
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check user
        if (post.profile.toString() !== profile.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.remove();

        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);

        res.status(500).send('Server Error');
    }
});



// @route    PUT api/posts/:id
// @desc     edit /update a post
// @access   Private
router.put(
    '/:id', auth, profileAuth, checkObjectId('id'),
    check(
        'text',
        'Please enter a post that mmet our reqirements'
    ).isLength({ min: 1, max: 300 }),
    // async ({ params: { post_id } }, res) => {
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            const profile = await Profile.findOne({ user: req.user.id })

            // check post
            if (!post) {
                return res.status(404).json({ msg: 'Post not found' });
            }

            // Check user
            if (post.profile.toString() !== profile.id) {
                return res.status(401).json({ msg: 'User not authorized' });
            }

            const { text, ...rest } = req.body;
            let updatePost = {
                text,
                ...rest
            }
            let updatedPost = await Post.findOneAndUpdate({ _id: post.id }, { ...updatePost }, { new: true });
            return res.json(updatedPost);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });




// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', auth, profileAuth, checkObjectId('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const profile = await Profile.findOne({ user: req.user.id })

        // Check if the post has already been liked
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        if (post.likes.some((like) => like.profile.toString() === profile.id)) {
            return res.status(400).json({ msg: 'Post already liked' });
        }
        // console.log("req.profile", req.profile);
        post.likes.unshift({ profile: profile.id });
        await post.save();

        return res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put('/unlike/:id', auth, profileAuth, checkObjectId('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const profile = await Profile.findOne({ user: req.user.id })

        // Check if the post has not yet been liked
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        if (!post.likes.some((like) => like.profile.toString() === profile.id)) {
            return res.status(400).json({ msg: 'Like post to proceed' });
        }

        // remove the like  
        post.likes = post.likes.filter(
            ({ profile }) => { profile.toString() !== profile }
        );
        await post.save();

        return res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private 
router.post(
    '/comment/:id',
    auth,
    profileAuth,
    checkObjectId('id'),
    check('text', 'Text is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ msg: 'Post not found' });
            }

            const newComment = {
                text: req.body.text,
                profile: profile.id,
            };
            post.comments.unshift(newComment);
            await post.save();

            res.json(post);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);





// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, profileAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const profile = await Profile.findOne({ user: req.user.id })

        // Pull out comment Make sure comment exists
        const comment = post.comments.find(
            (comment) => comment.id === req.params.comment_id
        );
        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        // Check user
        if (comment.profile.toString() !== profile.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        post.comments = post.comments.filter(
            ({ id }) => id !== req.params.comment_id
        );
        await post.save();

        return res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});




// // @route    GET api/posts/comments/:id
// // @desc     Get comments by post ID
// // @access   Public
// router.get('/comments/:id', checkObjectId('id'), async (req, res) => {
//     try {
//         const post = await Post.findById(req.params.id);
//         if (!post) {
//             return res.status(404).json({ msg: 'Post not found' });
//         }
//         const comments = await Comment.find({ post: post.id })

//         res.json({ post, comments });
//     } catch (err) {
//         console.error(err.message);

//         res.status(500).send('Server Error');
//     }
// });





module.exports = router;