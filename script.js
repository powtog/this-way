const profileForm = document.getElementById("profile-form");

// Restore the saved profile so residents can review or edit their answers.
const savedProfile = localStorage.getItem("thisWayProfile");

if (savedProfile) {
    const profile = JSON.parse(savedProfile);

    document.getElementById("about-me").value = profile.aboutMe;
    document.getElementById("friend-type").value = profile.friendType;
    document.getElementById("availability").value = profile.availability;
}

// Fictional residents in one demo building for testing matches.
const neighbors = [
    {
        id: "demo-resident-001",
        name: "Alex",
        aboutMe: "I enjoy neighborhood walks, coffee, and photography.",
        friendType: "activity",
        availability: "weeknights"
    },
    {
        id: "demo-resident-002",
        name: "Sam",
        aboutMe: "I love gardening, park picnics, and cooking.",
        friendType: "casual",
        availability: "weekend-afternoons"
    },
    {
        id: "demo-resident-003",
        name: "Jordan",
        aboutMe: "I'm studying computer science and enjoy hiking.",
        friendType: "close",
        availability: "weekend-mornings"
    },
    {
        id: "demo-resident-004",
        name: "Priya",
        aboutMe: "I enjoy running, outdoor yoga, and exploring parks.",
        friendType: "activity",
        availability: "weekend-mornings"
    },
    {
        id: "demo-resident-005",
        name: "Marcus",
        aboutMe: "I work in design and enjoy sketching outside and talking about creative projects.",
        friendType: "networking",
        availability: "weeknights"
    },
    {
        id: "demo-resident-006",
        name: "Taylor",
        aboutMe: "I enjoy reading, birdwatching, and relaxed walks with friends.",
        friendType: "close",
        availability: "weekday-afternoons"
    }
];

// Translate stored values into labels people can read.
const friendshipLabels = {
    casual: "Casual friends",
    activity: "Activity buddies",
    close: "Close friendships",
    networking: "Networking"
};

profileForm.addEventListener("submit", function(event) {
    // Handle the form here instead of letting the browser navigate away.
    event.preventDefault();

    const aboutMe = document.getElementById("about-me").value.trim();
    const friendType = document.getElementById("friend-type").value;
    const availability = document.getElementById("availability").value;
    const results = document.getElementById("results");

    // Stop early if an answer is missing.
    if (!aboutMe || !friendType || !availability) {
        results.textContent = "Please fill out all three fields.";
        return;
    }

    const profile = {
        aboutMe: aboutMe,
        friendType: friendType,
        availability: availability
    };

    // filter() makes a new list containing only neighbors with the same schedule.
    const availableNeighbors = neighbors.filter(function(neighbor) {
        return neighbor.availability === profile.availability;
    });

    // Rank shared friendship goals first, keeping other available neighbors visible.
    availableNeighbors.sort(function(firstNeighbor, secondNeighbor) {
        const firstMatches = firstNeighbor.friendType === profile.friendType;
        const secondMatches = secondNeighbor.friendType === profile.friendType;

        // true becomes 1 and false becomes 0; a negative result puts firstNeighbor first.
        return Number(secondMatches) - Number(firstMatches);
    });

    console.log("Neighbors with matching availability:", availableNeighbors);
    console.log(profile);

    // Save this profile in the browser so it survives a reload.
    localStorage.setItem("thisWayProfile", JSON.stringify(profile));

    // Clear the previous results before showing this submission.
    results.textContent = "";

    if (availableNeighbors.length === 0) {
        results.textContent = "No neighbors share that availability yet.";
    } else {
        const heading = document.createElement("h2");
        heading.textContent = "Neighbors who share your availability";
        results.appendChild(heading);

        // Build one paragraph per neighbor, with a reason for the recommendation.
        availableNeighbors.forEach(function(neighbor) {
            const description = document.createElement("p");
            const sameFriendshipGoal = neighbor.friendType === profile.friendType;

            const matchReason = sameFriendshipGoal
                ? "You share availability and a friendship goal."
                : "You share availability.";

            // Look up a readable label using the neighbor's stored friendship value.
            const friendshipLabel = friendshipLabels[neighbor.friendType];

            description.textContent =
                `${neighbor.name}: ${neighbor.aboutMe} Looking for: ${friendshipLabel}. ${matchReason}`;

            results.appendChild(description);
        });
    }
});
