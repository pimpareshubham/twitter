import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../src/config";
import "./Profile.css";

const ModifiedProfile = () => {
  const user = useSelector((state) => state.userReducer);

  const { userId } = useParams();

  const [userProfile, setUserProfile] = useState({});
  // const [show, setShow] = useState(false);
  const [following, setFollowing] = useState(false);

  const [myallposts, setMyallposts] = useState([]);
  const [liked, setLiked] = useState(false);

  const [commentBox, setCommentBox] = useState(false);
  const [comment, setComment] = useState("");

  // const handleShow = () => setShow(true);
  // const handleClose = () => setShow(false);

  const CONFIG_OBJ = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  };

  const handleFetchError = (error, errorMessage) => {
    console.error(errorMessage, error);
    Swal.fire({
      icon: "error",
      title: errorMessage,
      text: error.message,
    });
  };

  const fetchUserProfile = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/user/${userId}`, CONFIG_OBJ);
      setUserProfile(data);
      getMyPosts();
    } catch (error) {
      handleFetchError(error, "Error fetching user data");
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const checkFollowingStatus = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/checkfollow/${userId}`, CONFIG_OBJ);

      if (data) {
        setFollowing(data.following);
      }
    } catch (error) {
      handleFetchError(error, "Error checking following status");
    }
  };

  useEffect(() => {
    checkFollowingStatus();
  }, [userId]);

  useEffect(() => {
    if (user.following && user.following.includes(userId)) {
      setFollowing(true);
    } else {
      setFollowing(false);
    }

    getMyPosts();
  }, [userId, user]);

  const toggleFollow = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/follow/${userProfile._id}`,
        {},
        CONFIG_OBJ
      );

      if (response.status === 200) {
        setFollowing(true);
        fetchUserProfile();
      }
    } catch (error) {
      handleFetchError(error, "Error following user");
    }
  };

  const toggleUnfollow = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/unfollow/${userProfile._id}`,
        {},
        CONFIG_OBJ
      );

      if (response.status === 200) {
        setFollowing(false);
        fetchUserProfile();
      }
    } catch (error) {
      handleFetchError(error, "Error unfollowing user");
    }
  };

  const getMyPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/userposts/${userId}`, CONFIG_OBJ);

      if (response.status === 200) {
        setMyallposts(response.data.posts || []);
      } else {
        Swal.fire({
          icon: "error",
          title: "Some error occurred while getting all your posts",
        });
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const deletePost = async (postId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/deletepost/${postId}`,
        CONFIG_OBJ
      );

      if (response.status === 200) {
        getMyPosts();
        // setShow(false);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const submitComment = async (postId) => {
    setCommentBox(false);
    const request = { postId: postId, commentText: comment };
    const response = await axios.put(
      `${API_BASE_URL}/comment`,
      request,
      CONFIG_OBJ
    );
    if (response.status === 200) {
      getMyPosts();
    }
  };

  const likeDislikePost = async (postId, type) => {
    const request = { postId: postId };
    try {
      const response = await axios.put(
        `${API_BASE_URL}/${type}`,
        request,
        CONFIG_OBJ
      );
      if (response.status === 200) {
        const updatedPosts = myallposts.map((p) =>
          p._id === postId ? { ...p, likes: response.data.likes } : p
        );
        setMyallposts(updatedPosts);
        setLiked(type === "like");
      }
    } catch (error) {
      console.error("Error liking/disliking post:", error);
    }
  };

  

  return (
    <div className="container profile-body mt-3 p-4">
      <div className="row">
        <div className="col-md-6 d-flex flex-column">
          <img
            className="p-2 profile-pic img-fluid"
            alt="profile pic"
            src={userProfile.profileImageUrl}
          />
          <p className="ms-3 fs-5 fw-bold">{userProfile.fullName}</p>
          <p className="ms-3 fs-5">{userProfile.email}</p>
          <p className="ms-3 fs-5">{userProfile.description}</p>
        </div>
        <div className="col-md-6 d-flex flex-column justify-content-between mt-3">
          <div className="d-flex justify-content-equal mx-auto">
            <div className="count-section pe-4 pe-md-5 text-center fw-bold">
              <h4>{userProfile.posts ? userProfile.posts.length : 0}</h4>
              <p className="m-0">Posts</p>
            </div>
            <div className="count-section pe-4 pe-md-5 text-center fw-bold">
              <h4>{userProfile.followers ? userProfile.followers.length : 0}</h4>
              <p className="m-0">Followers</p>
            </div>
            <div className="count-section text-center fw-bold">
              <h4>{userProfile.following ? userProfile.following.length : 0}</h4>
              <p className="m-0">Following</p>
            </div>
          </div>
          <div className="mt-4 d-flex justify-content-between">
            {following ? (
              <button className="btn btn-secondary w-100" onClick={toggleUnfollow}>
                Unfollow
              </button>
            ) : (
              <button className="btn btn-primary w-100" onClick={toggleFollow}>
                Follow
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="d-flex justify-content-between">
          <h5>{userProfile.fullName}'s Posts</h5>
        </div>
        <div className="d-flex flex-wrap mt-3 row">
          {myallposts.slice().reverse().map((post, index) => (
            <div className="card shadow-sm col-12 mb-4" key={index}>
              <div className="card-body px-2">
                <div className="row">
                  <div className="col-6 d-flex">
                    <img
                      className="p-2 post-profile-pic"
                      alt="profile pic"
                      src={`${API_BASE_URL}/files/${userProfile.profileImageUrl}`}
                    />
                    <div className="mt-2">
                      <p className="fs-6 fw-bold">{post.author.fullName}</p>
                      <p className="location">{post.location}</p>
                    </div>
                  </div>
                  {post.author._id === user.user._id && (
                    <div className="col-6">
                      <i
                        onClick={() => deletePost(post._id)}
                        style={{ cursor: "pointer" }}
                        className="float-end fs-3 p-2 mt-2 fa fa-trash"
                      ></i>
                    </div>
                  )}
                  <p>{post.description}</p>
                </div>
                <div className="row">
                  <div className="col-12">
                    <img
                      style={{ borderRadius: "15px" }}
                      className="p-2 img-fluid"
                      alt={post.description}
                      src={post.image}
                    />
                  </div>
                </div>
                <div className="row my-3">
                  <div className="col-6 d-flex">
                    <i
                      onClick={() =>
                        likeDislikePost(post._id, liked ? "unlike" : "like")
                      }
                      className={`ps-2 fs-4 fa-regular ${liked ? "fa-heart text-danger" : "fa-heart"
                        }`}
                    />
                    <i
                      onClick={() => setCommentBox(true)}
                      className="ps-3 fs-4 fa-regular fa-comment"
                    ></i>
                  </div>
                  <div className="col-6">
                    <span className="pe-2 fs-6 fw-bold float-end">
                      {post.likes ? post.likes.length : 0} likes
                    </span>
                  </div>
                </div>
                {commentBox && (
                  <div className="row mb-2">
                    <div className="col-8">
                      <textarea
                        onChange={(e) => setComment(e.target.value)}
                        className="form-control"
                      ></textarea>
                    </div>
                    <div className="col-4">
                      <button
                        className="btn btn-primary"
                        onClick={() => submitComment(post._id)}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
                {Array.isArray(post.comments) &&
                  post.comments.slice().reverse().map((comment, commentIndex) => (
                    <div className="comment-card card m-2" key={commentIndex}>
                      <div className="row m-2 ">
                        <div className="col-12">
                          <Link to={`/profilePage_2/${comment.commentedBy._id}`} className='card-text'>
                            <h5>{comment.commentedBy.fullName}</h5>
                          </Link>


                          <p>{comment.commentText}</p>
                        </div>
                      </div>
                      <div className="row m-2">
                        <div className="col-6">
                          <i
                            style={{ color: "#ff0000" }}
                            className="ps-2 fa-solid fa-heart"
                          />
                        </div>
                        <div className="col-6">
                          <i className="ps-3 fs-4 fa-regular fa-comment" />
                        </div>
                      </div>
                    </div>
                  ))}
                <div className="row">
                  <div className="col-12">
                    <span className="p-2 text-muted">2 Hours Ago</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModifiedProfile;
