require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const UserRequest = require("./models/userRequest");
const NewCertificate = require("./models/newCertificate");
const User = require("./models/User");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");

const app = express();

const dbURI = process.env.MONGODB_CONNECTION_STRING;
mongoose
  .connect(dbURI)
  .then((result) => {
    app.listen(3000);
    console.log("Connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

app.set("view engine", "ejs");
app.use(morgan("dev"));
//takes all the url encoded data from the form and parses it into an object for use in the req object
app.use(express.urlencoded({ extended: true }));
// rendering static css files
app.use(express.static("assets"));
app.use(express.json());
app.use(cookieParser());

app.get('*', checkUser);

// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: "", password: "" };

  // incorrect email
  if (err.message === "Incorrect email") {
    errors.email = "Email address is not registered";
  }

  if (err.message === "Incorrect password") {
    errors.password = "Password is incorrect";
  }

  // Duplicate error code
  if (err.code === 11000) {
    errors.email = "Email already in use";
    return errors;
  }

  // validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

const maxAge = 1 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET, {
    expiresIn: maxAge
  });
}

app.get("/", requireAuth, (req, res) => {
  res.render("home", { title: "Home Page" });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

app.post("/login", async (req, res) => {
  // res.send("User Login");
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } 
  catch (err) {
    const errors = handleErrors(err);
    // res.status(400).json({ errors });
    res.send({ errors })
  }
});

app.get("/signup", (req, res) => {
  const userData = new User({
    email: "goerge@gmail.com",
    password: "test123",
  });

  userData
    .save()
    .then((result) => {
      // res.send(result);
      // res.send("User sign up");
      const token = createToken(userData._id);
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
      res.status(201).json({ result: userData._id });
      res.redirect("/login");
    })
    .catch((err) => {
      // console.log(err);
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    });
});

app.get("/total", async (req, res) => {
  try {
    const total = await UserRequest.countDocuments();
    res.send({ total });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/total-approved", async (req, res) => {
  try {
    const totalApproved = await UserRequest.countDocuments({
      status: "approved",
    });
    res.send({ totalApproved });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/total-certificates", async (req, res) => {
  try {
    const totalCertificates = await NewCertificate.countDocuments();
    res.send({ totalCertificates });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/collected-certificates", async (req, res) => {
  try {
    const collectedCertificates = await NewCertificate.countDocuments({
      status: "Collected",
    });
    res.send({ collectedCertificates });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/requests", requireAuth, (req, res) => {
  UserRequest.find()
    .then((result) => {
      res.render("requests", { request: result, title: "Requests Page" });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/request-form", (req, res) => {
  res.render("request_form", { title: "Request Form" });
});

app.get("/request_submitted", (req, res) => {
  res.render("request_submitted", { title: "Successful Submission" });
});

app.get("/request-approved/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const updateRequest = await UserRequest.findById(id);

    // Update the status to "approved"
    updateRequest.status = "approved";

    // Save the updated document
    await updateRequest.save();

    // Redirect to the requests page
    res.redirect("/requests");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating request status");
  }
});

app.get("/request-rejected/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const updateRequest = await UserRequest.findById(id);

    // Update the status to "approved"
    updateRequest.status = "rejected";

    // Save the updated document
    await updateRequest.save();

    // Redirect to the requests page
    res.redirect("/requests");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating request status");
  }
});

// handling a post request
app.post("/submitting_request", (req, res) => {
  // console.log(req.body);
  const userRequest = new UserRequest(req.body);

  userRequest
    .save()
    .then((result) => {
      res.redirect("/request_submitted");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/add-new-certificate", requireAuth, (req, res) => {
  res.render("new-certificate", { title: "Add New Certificate" });
});

app.post("/submiting-new-certificate", requireAuth, (req, res) => {
  // console.log(req.body);
  const newCertificate = new NewCertificate(req.body);

  newCertificate
    .save()
    .then((result) => {
      res.redirect("/add-new-certificate");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/certificate-list", requireAuth, (req, res) => {
  NewCertificate.find()
    .then((result) => {
      res.render("certificate-list", {
        certificate: result,
        title: "Certificate List",
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/certificate-pending/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const updateCertificate = await NewCertificate.findById(id);

    // Update the status to "pending"
    updateCertificate.status = "Pending";

    // Save the updated document
    await updateCertificate.save();

    // Redirect to the requests page
    res.redirect("/certificate-list");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating request status");
  }
});

app.get("/certificate-collected/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const updateCertificate = await NewCertificate.findById(id);

    // Update the status to "collected"
    updateCertificate.status = "Collected";

    // Save the updated document
    await updateCertificate.save();

    // Redirect to the requests page
    res.redirect("/certificate-list");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating request status");
  }
});

app.get("/logout", (req,res) => {
  res.cookie('jwt', "", { maxAge: 1 });
  res.redirect('/login');
})

app.use((req, res) => {
  res.status(404).render("404", { title: "404 Page" });
});
