const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Post = require('./models/post');
const Trip = require('./models/trip');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const User = require('./models/user');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3200;
mongoose.connect("mongodb+srv://vyshds:fxJpBzflMLmE0ldx@cluster0.yvfz1ue.mongodb.net/node-angular?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log("Db connection failed",err.message);
  })

// let posts = [];


app.use(cors({
  origin: 'http://localhost:4300'
}));
app.use(bodyParser.json({ limit: '200mb' }));
app.use(express.json({ limit: '200mb' }));

app.use((req, res, next) => {
  // console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

app.post('/api/trips', upload.single('coverPhoto'), async (req, res) => {
  try {
    const url = `${req.protocol}://${req.get('host')}`;
    const coverPhotoPath = req.file ? `${url}/uploads/${req.file.filename}` : null;

    const trip = new Trip({
      destination: req.body.destination,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      coverPhoto: coverPhotoPath,
      creatorId: req.body.creatorId
    });
    const savedTrips = await trip.save();
    res.status(201).json({ message: 'Trip added successfully', trips: savedTrips });
  } catch (error) {
    res.status(500).json({ message: 'Error adding trip', error: error.message });
  }
});

app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    const url = `${req.protocol}://${req.get('host')}`;
    const imagePath = req.file ? `${url}/uploads/${req.file.filename}` : null;

    const post = new Post({
      title: req.body.title,
      caption: req.body.caption,
      image: imagePath,
      creatorId: req.body.creatorId,
      tripId: req.body.tripId || null,
      skipImage: req.body.skipImage === 'true',
      value: req.body.value,
      date: req.body.date,
    });

    const savedPost = await post.save();
    res.status(201).json({ message: 'Post added successfully', posts: savedPost });
  } catch (error) {
    res.status(500).json({ message: 'Error adding post', error: error.message });
  }
});

app.get('/api/posts/creator/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;
    const documents = await Post.find({ creatorId });
    const data = documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      caption: doc.caption,
      image: doc.image || null,
      creatorId: doc.creatorId,
      tripId: doc.tripId || null,
      skipImage: doc.skipImage,
      value: doc.value,
      date: doc.date
    }));
    res.status(200).json({ message: 'Posts fetched successfully', posts: data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
});

app.get('/api/posts/trip/:tripId', async (req, res) => { //fetching posts by tripId on clicking view details from trip dashboard
  try {
    const { tripId } = req.params;
    const documents = await Post.find({ tripId });
    const data = documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      caption: doc.caption,
      image: doc.image || null,
      creatorId: doc.creatorId,
      tripId: doc.tripId || null,
      skipImage: doc.skipImage,
      value: doc.value,
      date: doc.date
    }));
    res.status(200).json({ message: 'Posts fetched successfully', posts: data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
});

app.get('/api/trips/creator/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;
    const fetchedTrips = await Trip.find({ creatorId });
    res.status(200).json({ message: 'Trips fetched successfully', trips: fetchedTrips });
  }
  catch (error) {
    res.status(500).json({ message: 'Error fetching trips', error: error.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const result = await Post.deleteOne({ _id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post', error: error.message })
  }
})

app.delete('/api/trips/:tripId', async (req, res) => {
  try {
    const result = await Trip.deleteOne({ _id: req.params.tripId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.status(200).json({
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting trip', error: error.message })
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post) {
      res.status(200).json({
        id: post._id,
        title: post.title,
        caption: post.caption,
        image: post.image,
        skipImage: post.skipImage,
        value: post.value,
        date: post.date,
        tripId: post.tripId || null,
        creatorId: post.creatorId
      })
    }
    else {
      res.status(404).json({
        message: 'Post not found'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
});

app.get('/api/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (trip) {
      res.status(200).json({
        id: trip._id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverPhoto: trip.coverPhoto || null,
        skipImage: trip.skipImage || false,
        creatorId: trip.creatorId
      });
    } else {
      res.status(404).json({
        message: 'Trip not found'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trip', error: error.message });
  }
});

app.put('/api/posts/:id', upload.single('image'), async (req, res) => {
  try {
    const url = `${req.protocol}://${req.get('host')}`;
    let imagePath = req.body.image;

    // If a new image was uploaded
    if (req.file) {
      imagePath = `${url}/uploads/${req.file.filename}`;
    }

    const updatedPost = {
      title: req.body.title,
      caption: req.body.caption,
      image: imagePath,
      skipImage: req.body.skipImage === 'true',
      value: req.body.value,
      date: req.body.date,
      tripId: req.body.tripId || null,
    };

    const result = await Post.updateOne({ _id: req.params.id }, updatedPost);

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
    } else {
      res.status(404).json({ message: 'Post not found or no changes made' });
    }
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
});

app.put('/api/trips/:id', upload.single('coverPhoto'), async (req, res) => {
  try {
    const url = `${req.protocol}://${req.get('host')}`;
    let imagePath = req.body.coverPhoto;

    // If a new image was uploaded
    if (req.file) {
      imagePath = `${url}/uploads/${req.file.filename}`;
    }

    // If skipImage was checked, or coverPhoto was explicitly cleared, remove image
    if (req.body.skipImage === 'true' || imagePath === '') {
      imagePath = null;
    }

    const updatedTrip = {
      destination: req.body.destination,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      coverPhoto: imagePath,
      creatorId: req.body.creatorId
    };

    const result = await Trip.updateOne({ _id: req.params.id }, updatedTrip);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Even if no fields actually changed, consider the operation successful
    res.status(200).json({ message: 'Trip updated successfully', trip: updatedTrip });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ message: 'Error updating trip', error: error.message });
  }
});


app.post('/api/users', upload.none(), async (req, res) => { //signup api
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })

    const savedUser = await user.save();
    res.status(201).json({
      message: 'Signup successfull', user: savedUser
    });
  } catch (error) {
    res.status(500).json({
      message: 'Signup failed', error: error
    });
  }

})

app.get('/api/users', async (req,res) => {
  try {
    const fetchUsers = await User.find();
    res.status(201).json({message: 'Fetched Users succesfully', users: fetchUsers});
  } catch(error) {
    res.status(500).json({message: 'User fetch failed', error: error})
  }
})

app.post('/api/login', upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    res.status(200).json({ message: 'Login successful', user: user })
    
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Login failed', error: error })
  }
  
})

app.get('/api/login', async(req,res) => {
  try {
   const user = await User.find();
   res.status(201).json({message: 'Fetched Users succesfully', users: user})
  }catch(error) {
    res.status(500).json({message: 'User fetch failed', error: error})
  }
})

app.listen(PORT, 'localhost', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
