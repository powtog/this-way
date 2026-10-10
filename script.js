const profileForm = document.getElementById("profile-form");

profileForm.addEventListener("submit", function(event) {
    event.preventDefault();


const aboutMe = document.getElementById("about-me").value.trim();
const friendType = document.getElementById("friend-type").value;
const availability = document.getElementById("availability").value;

const results = document.getElementById("results");

// Checks that no fields are empty.
if (!aboutMe || !friendType || !availability) {
    results.textContent = "Please fill out all three fields.";
    return;
}

const profile = {
    aboutMe: aboutMe,
    friendType: friendType,
    availability: availability
};

console.log(profile);

// Save this profile in the browser so it survives a reload.
localStorage.setItem("thisWayProfile", JSON.stringify(profile));

// Displays the results of what the user has filled out onto the page. 
results.textContent =
    `You're looking for ${profile.friendType} friendships and are free ${profile.availability}.`;
});