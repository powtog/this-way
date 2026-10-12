const profileForm = document.getElementById("profile-form");
const results = document.getElementById("results");
const statusMessage = document.getElementById("app-status");
let currentProfile = null;

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

const availabilityLabels = {
    "weekday-mornings": "Weekday mornings",
    "weekday-afternoons": "Weekday afternoons",
    "weeknights": "Weeknights",
    "weekend-mornings": "Weekend mornings",
    "weekend-afternoons": "Weekend afternoons",
    "weekend-nights": "Weekend nights"
};

// Check saved data before using it: storage may be old, damaged, or unavailable.
function isValidProfile(profile) {
    return profile && typeof profile.aboutMe === "string" &&
        profile.aboutMe.trim().length > 0 && profile.aboutMe.length <= 2000 &&
        Object.hasOwn(friendshipLabels, profile.friendType) &&
        Object.hasOwn(availabilityLabels, profile.availability);
}

try {
    const savedProfile = JSON.parse(localStorage.getItem("thisWayProfile"));
    if (isValidProfile(savedProfile)) currentProfile = savedProfile;
} catch {
    // A storage problem should not stop someone from trying the demo.
    statusMessage.textContent = "Saved preferences could not be loaded. You can still try the demo.";
}

function fillProfileForm(profile) {
    document.getElementById("about-me").value = profile.aboutMe;
    document.getElementById("friend-type").value = profile.friendType;
    document.getElementById("availability").value = profile.availability;
}

// A view is simply a section of the page. Show one and hide the others.
function showView(viewId) {
    ["matches-view", "community-view", "profile-view"].forEach(function(id) {
        document.getElementById(id).hidden = id !== viewId;
    });
    document.querySelectorAll("[data-view]").forEach(function(button) {
        if (button.dataset.view === viewId) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });
    document.querySelector(`#${viewId} h2`).focus();
}

// Cards use textContent so profile text is displayed safely as text.
function createNeighborCard(neighbor) {
    const card = document.createElement("article");
    card.className = "neighbor-card";
    const avatar = document.createElement("span");
    avatar.className = `avatar avatar-${neighbor.id.slice(-1)}`;
    avatar.textContent = neighbor.name[0];
    avatar.setAttribute("aria-hidden", "true");
    const name = document.createElement("h3");
    name.textContent = neighbor.name;
    const introduction = document.createElement("p");
    introduction.textContent = neighbor.aboutMe;
    const preferences = document.createElement("p");
    preferences.className = "preferences";
    preferences.textContent = `${friendshipLabels[neighbor.friendType]} · ${availabilityLabels[neighbor.availability]}`;
    card.append(avatar, name, introduction, preferences);
    return card;
}

// Demo addresses use example.com and cannot connect visitors to real residents.
function addContactOption(card, neighbor) {
    const contact = document.createElement("details");
    contact.className = "match-contact";
    const toggle = document.createElement("summary");
    toggle.textContent = `Show ${neighbor.name}’s email`;
    const email = document.createElement("p");
    email.className = "contact-email";
    email.textContent = `${neighbor.name.toLowerCase()}@example.com`;
    const note = document.createElement("p");
    note.className = "contact-note";
    note.textContent = "Fictional demo email — messages will not reach a real neighbor.";
    contact.append(toggle, email, note);
    card.appendChild(contact);
}

function addActivityButton(card, neighbor, profile) {
    // Ask for AI only when clicked, rather than spending quota on every match.
    const activityButton = document.createElement("button");
    activityButton.type = "button";
    activityButton.textContent = "Suggest an outdoor activity with Gemma";

    const activityResult = document.createElement("p");
    activityResult.setAttribute("aria-live", "polite");
    activityResult.className = "activity-result";

    activityButton.addEventListener("click", async function() {
        activityButton.disabled = true;
        activityButton.textContent = "Finding an idea…";
        activityResult.dataset.state = "loading";
        activityResult.setAttribute("aria-busy", "true");
        activityResult.textContent = "Gemma is thinking of an activity…";

        try {
            // fetch() sends these profiles to our backend, which holds the key.
            const response = await fetch("/api/activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile: profile, neighbor: neighbor }),
                signal: AbortSignal.timeout(60000)
            });

            // Live Server cannot run our backend; use the Node server instead.
            if (!(response.headers.get("content-type") || "").includes("application/json")) {
                throw new Error("Open the app at http://127.0.0.1:3000 using the Node server.");
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Could not generate an activity.");
            }

            // Treat AI output as text, never executable HTML.
            activityResult.textContent = `Gemma suggestion: ${data.activity}`;
            activityResult.dataset.state = "success";
        } catch (error) {
            activityResult.dataset.state = "error";
            activityResult.textContent = error.name === "TimeoutError"
                ? "This is taking longer than expected. Please try again."
                : error.message;
        } finally {
            activityButton.disabled = false;
            activityButton.textContent = activityResult.dataset.state === "error"
                ? "Try activity suggestion again" : "Suggest an outdoor activity with Gemma";
            activityResult.setAttribute("aria-busy", "false");
        }
    });

    card.append(activityButton, activityResult);
}

function renderMatches() {
    // filter() produces a separate array; sorting it preserves directory order.
    const availableNeighbors = neighbors.filter(function(neighbor) {
        return neighbor.availability === currentProfile.availability;
    });
    availableNeighbors.sort(function(firstNeighbor, secondNeighbor) {
        const firstMatches = firstNeighbor.friendType === currentProfile.friendType;
        const secondMatches = secondNeighbor.friendType === currentProfile.friendType;
        return Number(secondMatches) - Number(firstMatches);
    });
    results.textContent = "";
    if (availableNeighbors.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        const title = document.createElement("h3");
        title.textContent = "Different schedules. Still good neighbors.";
        const explanation = document.createElement("p");
        explanation.textContent = "Nobody shares that availability yet. Meet everyone in Community, or adjust your preferences.";
        const browse = document.createElement("button");
        browse.type = "button";
        browse.textContent = "Explore the community";
        browse.addEventListener("click", () => showView("community-view"));
        empty.append(title, explanation, browse);
        results.appendChild(empty);
        return;
    }
    availableNeighbors.forEach(function(neighbor) {
        const card = createNeighborCard(neighbor);
        const reason = document.createElement("p");
        reason.className = "match-reason";
        reason.textContent = neighbor.friendType === currentProfile.friendType
            ? "You share availability and a friendship goal."
            : "You share availability.";
        card.appendChild(reason);
        // Capture this saved profile for the request associated with this card.
        addContactOption(card, neighbor);
        addActivityButton(card, neighbor, currentProfile);
        results.appendChild(card);
    });
}

// The community is independent of matching: everyone remains discoverable.
neighbors.forEach(function(neighbor) {
    document.getElementById("community-list").appendChild(createNeighborCard(neighbor));
});

document.getElementById("try-demo").addEventListener("click", function() {
    document.getElementById("welcome").hidden = true;
    document.getElementById("demo-app").hidden = false;
    if (currentProfile) {
        fillProfileForm(currentProfile);
    } else {
        fillProfileForm({
            aboutMe: "",
            friendType: "",
            availability: ""
        });
    }
    // Always let visitors review their profile before continuing to matches.
    showView("profile-view");
});

document.getElementById("use-example").addEventListener("click", function() {
    // Fill the form only: the visitor still chooses when to save and find matches.
    fillProfileForm({
        aboutMe: "I enjoy neighborhood walks, photography, and meeting new people.",
        friendType: "activity",
        availability: "weeknights"
    });
    document.getElementById("profile-error").textContent = "";
    statusMessage.textContent = "Example answers filled in. Edit them or choose Find My Matches to continue.";
    document.getElementById("about-me").focus();
});

document.querySelectorAll("[data-view]").forEach(function(button) {
    button.addEventListener("click", function() {
        if (button.dataset.view === "matches-view" && !currentProfile) {
            statusMessage.textContent = "Save your demo profile first to see suggested matches.";
            showView("profile-view");
            return;
        }
        statusMessage.textContent = "";
        if (button.dataset.view === "matches-view") renderMatches();
        showView(button.dataset.view);
    });
});

profileForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const profile = {
        aboutMe: document.getElementById("about-me").value.trim(),
        friendType: document.getElementById("friend-type").value,
        availability: document.getElementById("availability").value
    };
    const error = document.getElementById("profile-error");
    if (!isValidProfile(profile)) {
        error.textContent = "Please fill out all three fields. Keep your introduction to 2,000 characters or fewer.";
        return;
    }
    error.textContent = "";
    currentProfile = profile;
    try {
        localStorage.setItem("thisWayProfile", JSON.stringify(profile));
        statusMessage.textContent = "Profile saved in this browser. Your matches have been updated.";
    } catch {
        statusMessage.textContent = "Your matches are updated, but this browser could not save your profile for next time.";
    }
    renderMatches();
    showView("matches-view");
});
