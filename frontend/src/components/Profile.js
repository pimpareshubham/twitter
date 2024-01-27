import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form'; // Import Form
import Button from 'react-bootstrap/Button'; // Import Button
import { API_BASE_URL } from '../../src/config';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import './Profile.css';


const Profile = () => {
  const user = useSelector(state => state.userReducer);
  const navigate = useNavigate();

  const [image, setImage] = useState({ preview: '', data: '' });
  const [myallposts, setMyallposts] = useState([]);
  // const [postDetail, setPostDetail] = useState({});
  const [show, setShow] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');


  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [commentBox, setCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [userProfile, setUserProfile] = useState({});


  const handleShow = () => setShow(true);
  const handlePostClose = () => setShowPost(false);
  const handlePostShow = () => setShowPost(true);
  const handleClose = () => setShow(false);

  const CONFIG_OBJ = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token'),
    },
  };

  console.log('Token:', localStorage.getItem('token'));


  useEffect(() => {
    console.log('User Information:', user);
    getMyPosts();
  }, [user]);


  useEffect(() => {
    const fetchData = async () => {
      await getMyPosts();
    };

    fetchData();
  }, [user]);





  const deletePost = async (postId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/deletepost/${postId}`, CONFIG_OBJ);

      if (response.status === 200) {
        getMyPosts();
        setShow(false);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };


  // Function to close the comment modal


  const submitComment = async (postId) => {
    setCommentBox(false);
    const request = { 'postId': postId, 'commentText': comment };
    const response = await axios.put(`${API_BASE_URL}/comment`, request, CONFIG_OBJ);
    if (response.status === 200) {
      getMyPosts();
    }
  };


  const likeDislikePost = async (postId, type) => {
    const request = { 'postId': postId };
    const response = await axios.put(`${API_BASE_URL}/${type}`, request, CONFIG_OBJ);
    if (response.status === 200) {
      // Update liked status for the specific post
      setLikedPosts(prevLikedPosts => ({
        ...prevLikedPosts,
        [postId]: type === 'like'
      }));
      getMyPosts();
    }
  };

  const handleProfileImageSelect = (event) => {
    const selectedImage = event.target.files[0];
    setSelectedProfileImage(selectedImage);

    // Preview the selected image
    const imgPreview = URL.createObjectURL(selectedImage);
    setProfileImagePreview(imgPreview);
  };

  const uploadProfileImage = async () => {
    try {
      const formData = new FormData();

      // Append profile image if selected
      if (selectedProfileImage) {
        formData.append('file', selectedProfileImage);
      }

      // Append other fields if not empty
      if (fullName) {
        formData.append('fullName', fullName);
      }

      if (email) {
        formData.append('email', email);
      }

      if (description) {
        formData.append('description', description);
      }

      // Adjust the API_BASE_URL to match your backend server
      const response = await axios.post(`${API_BASE_URL}/updateProfileDetails`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
      });

      if (response.status === 200) {
        // Handle success (e.g., show a success message)
        console.log('Profile image uploaded successfully');
        getMyPosts()



      } else {
        // Handle failure (e.g., show an error message)
        console.error('Failed to upload profile image');
      }

      // Close the modal after upload
      handleClose();
    } catch (error) {
      console.error('Error uploading profile image:', error);
      // Handle the error (e.g., show an error message to the user)
    }
  };


  const handleFileSelect = (event) => {
    const img = {
      preview: URL.createObjectURL(event.target.files[0]),
      data: event.target.files[0],
    };
    setImage(img);
  };

  const handleImgUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('file', image.data);
  
      const response = await axios.post(`${API_BASE_URL}/uploadFile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      return response;
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };



  const getMyPosts = async () => {
    try {
      // Fetch user details along with posts
      const userResponse = await axios.get(`${API_BASE_URL}/myprofile`, CONFIG_OBJ);
      setUserProfile(userResponse.data); // Set the user profile state

      // Fetch user posts
      const postsResponse = await axios.get(`${API_BASE_URL}/myallposts`, CONFIG_OBJ);

      if (postsResponse.status === 200) {
        setMyallposts(postsResponse.data.posts);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Some error occurred while getting all your posts',
        });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };



  const addPost = async () => {
    if (image.preview === '') {
      Swal.fire({
        icon: 'error',
        title: 'Post image is mandatory!',
      });
    } else if (caption === '') {
      Swal.fire({
        icon: 'error',
        title: 'Post caption is mandatory!',
      });
    } else if (location === '') {
      Swal.fire({
        icon: 'error',
        title: 'Location is mandatory!',
      });
    } else {
      setLoading(true);
      try {
        const imgRes = await handleImgUpload();
        const request = {
          description: caption,
          location: location,
          image: imgRes.data.publicUrl,
        };
        const postResponse = await axios.post(`${API_BASE_URL}/createpost`, request, CONFIG_OBJ);
        setLoading(false);
        

        if (postResponse.status === 201) {
          // Show a success message using SweetAlert
          Swal.fire({
            icon: 'success',
            title: 'Post uploaded successfully!',
          }).then(() => {
            navigate('/home');
          });
          setShow(false)
          getMyPosts();

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Some error occurred while creating post',
          });
        }
      } catch (error) {
        console.error('Error creating post:', error);
      }
    }
  };

  useEffect(() => {
    getMyPosts();
  }, []);

  return (
    <div className="container profile-body  mt-3 p-4">
      <div className="row">
        <div className="col-md-6 d-flex flex-column">
          <img
            className="p-2 profile-pic img-fluid"
            alt="profile pic"
            src={userProfile.profileImageUrl}


          />
          <p className="ms-3 fs-5 fw-bold">{userProfile.fullName}</p>
          <p className="ms-3 fs-5">{userProfile.email}</p>
          <p className="ms-3 fs-5"><b></b>{userProfile.description}</p>
          {/* <p className="ms-3 fs-5">
            My portfolio on <a href="#">www.portfolio.com/{user.user.fullName}</a>
          </p> */}
        </div>
        <div className="col-md-6 d-flex flex-column justify-content-between mt-3">
          <div className="d-flex justify-content-equal mx-auto">
            <div className="count-section pe-4 pe-md-5 text-center fw-bold">
              <h4>{myallposts.length}</h4>
              <p className="m-0">Posts</p>
            </div>
            <div className="count-section pe-4 pe-md-5 text-center fw-bold">
              <h4>{userProfile.followers}</h4>
              <p className="m-0">Followers</p>
            </div>
            <div className="count-section text-center fw-bold">
              <h4>{userProfile.following}</h4>
              <p className="m-0">Following</p>
            </div>
          </div>
          <div className="mt-4 d-flex justify-content-between">
            <button className="btn btn-primary w-100" onClick={handlePostShow}>
              + Add Post
            </button>
            <button onClick={handleShow} className="btn btn-primary w-100 ms-2">Edit Profile</button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="d-flex justify-content-between">
          <h3>My Posts</h3>
        </div>
        <div className="d-flex flex-wrap mt-3 row">
          {myallposts.slice().reverse().map((post, index) => (
            <div className="card shadow-sm col-12 mb-4" key={index}>
              <div className="card-body px-2">
                <div className='row'>
                  <div className='col-6 d-flex'>
                    <img className='p-2 post-profile-pic' alt="profile pic" src={userProfile.profileImageUrl} />
                    <div className='mt-2'>
                      <p className='fs-6 fw-bold'>{post.author.fullName}</p>
                      <p className='location'>{post.location}</p>
                    </div>
                  </div>
                  {post.author._id === user.user._id && (
                    <div className='col-6'>
                      <i onClick={() => deletePost(post._id)} style={{ cursor: "pointer" }} className='float-end fs-3 p-2 mt-2 fa fa-trash'></i>
                    </div>
                  )}
                  <p>{post.description}</p>
                </div>
                <div className='row'>
                  <div className='col-12'>
                    <img style={{ borderRadius: '15px' }} className='p-2 img-fluid' alt={post.description} src={post.image} />
                  </div>
                </div>
                <div className='row my-3'>
                  <div className='col-6 d-flex'>
                    <i
                      onClick={() => likeDislikePost(post._id, likedPosts[post._id] ? 'unlike' : 'like')}
                      className={`ps-2 fs-4 fa-regular ${likedPosts[post._id] ? 'fa-heart text-danger' : 'fa-heart'}`}
                    />
                    <i onClick={() => setCommentBox(true)} className="ps-3 fs-4 fa-regular fa-comment"></i>
                  </div>
                  <div className='col-6'>
                    <span className='pe-2 fs-6 fw-bold float-end'>{post.likes.length} likes</span>
                  </div>
                </div>
                {commentBox && (
                  <div className='row mb-2'>
                    <div className='col-8'>
                      <textarea onChange={(e) => setComment(e.target.value)} className='form-control'></textarea>
                    </div>
                    <div className='col-4'>
                      <button className='btn btn-primary' onClick={() => submitComment(post._id)}>Submit</button>
                    </div>
                  </div>
                )}
                {post.comments.slice().reverse().map((comment, commentIndex) => (
                  <div className="comment-card m-2" key={commentIndex}>
                    <div className="row card mt-2">
                      <div className="col-12 mt-2">
                        <Link to={`/profilePage_2/${comment.commentedBy._id}`} className='card-text'>
                          <h5>{comment.commentedBy.fullName}</h5>
                        </Link>

                        <p>{comment.commentText}
                        </p>
                      </div>
                      <div className="row ">
                        <div className="col-6">
                          {/* Like icon */}
                          <i
                            style={{ color: "#ff0000" }}
                            className="ps-2 fa-solid fa-heart"
                          />
                        </div>
                        <div className="col-6">
                          {/* Comment icon */}
                          <i
                            // Implement reply functionality if needed
                            className="ps-3 fs-4 fa-regular fa-comment"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
                <div className='row'>
                  <div className='col-12'>
                    <span className='p-2 text-muted'>2 Hours Ago</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>

      <Modal show={showPost} onHide={handlePostClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="imageUpload" className="form-label">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              id="imageUpload"
              onChange={handleFileSelect}
            />
          </div>
          {image.preview && (
            <img src={image.preview} alt="Preview" className="img-preview img-fluid" />
          )}
          <div className="mb-3">
            <label htmlFor="caption" className="form-label">
              Caption
            </label>
            <input
              type="text"
              className="form-control"
              id="caption"
              placeholder="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="location" className="form-label">
              Location
            </label>
            <input
              type="text"
              className="form-control"
              id="location"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary w-100"
            onClick={addPost}
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Add Post'}
          </button>
        </Modal.Body>
      </Modal>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Label>Profile Image</Form.Label>
            <input
              type="file"
              name="file"
              accept="image/*"
              className="form-control"
              id="imageUpload"
              onChange={handleProfileImageSelect}
            />
            {profileImagePreview && (
              <div>
                <p>Selected Image:</p>
                <img
                  src={profileImagePreview}
                  alt="Selected Profile Image"
                  className="img-preview img-fluid"
                />
              </div>
            )}

            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter a short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={uploadProfileImage}>
            Update Profile
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default Profile;
