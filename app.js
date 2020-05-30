var express                 = require('express'),
    app                     = express(),
    body                    = require('body-parser'),
    mongoose                = require('mongoose'),
    passport				= require('passport'),
    LocalStrategy			= require('passport-local'),
    expressSanitizer        = require('express-sanitizer'),
    methodOverride		    = require('method-override'),
    passportLocalMongoose 	= require('passport-local-mongoose'),
    User                    = require('./models/user.js'),
    Blog                    = require("./models/blogs.js");

var username;
var user;
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(body.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost:27017/blogApp",{ useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

 // PASSPORT CONFIG
 app.use(require('express-session')({
    secret: "This is a secret message",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req, res, next)
{
    res.locals.currentUser = req.user;
    next();
});
app.use(function(req, res, next)
{
    res.locals.currentUser = req.user;
    next();
});
app.use(express.static(__dirname + "/public"));
app.use(body.urlencoded({extended : true}));
app.set("view engine","ejs");


// Root route
app.get("/",isLoggedIn,function(req, res)
{
   res.redirect("/blogs"+username+"/profile"); 
});
// Profile Page
app.get("/blogs/:id/profile",isLoggedIn,function(req, res){
	req.params.id = username;
	res.render("profile",{currentUser:req.user,id:username});
});
// INDEX ROUTE
app.get("/blogs/:id",isLoggedIn,function(req, res)
{
    req.params.id = username;
    Blog.find({},function(err, blogs){
		if(err)
			{
				console.log(err);
			}
		else
			{
				res.render("index",{blogs:blogs,currentUser:req.user,id:username});
			}
	});
});
// NEW Route
app.get("/blogs/:id/new",isLoggedIn,function(req, res){
    req.params.id = username;
	res.render("new",{currentUser:req.user,id:username});
});

// CREATE ROUTE
app.post("/blogs/:id",function(req, res){
    req.params.id = username;
	req.body.blog.body = req.sanitize(req.body.blog.body);
// 	create blog
	Blog.create(req.body.blog,function(err, newBlog){
		if(err)
			{
				res.render("new");
			}
		else
			{
				// 	redirect to index
				res.redirect("/blogs/"+username);
			}
	});

});

// SHOW route
app.get("/blogs/:username/:id",function(req, res){
	req.params.username = username;
	Blog.findById(req.params.id,function(err, foundBlog){
		if(err)
			{
				console.log(err);
			}
		else
			{
				res.render("show",{blog: foundBlog,currentUser:req.user,id:username});
			}
	})
});

// EDIT Route
app.get("/blogs/:username/:id/edit",function(req, res){
	req.params.username = username;
	var blogid = req.params.id;
	Blog.findById(blogid,function(err,foundBlog){
		if(err)
			{
				res.redirect("/blogs/"+username);
			}
		else
			{
				res.render("edit",{blog:foundBlog,currentUser:req.user,id:username});
			}
	})
	
});

// UPDATE Route
app.put("/blogs/:username/:id",function(req, res){
	req.params.username = username;
	req.body.blog.body = req.sanitize(req.body.blog.body);
	Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err, updatedBlog){
		if(err)
			{
				res.redirect("/");
			}
		else
			{
				res.redirect("/blogs/"+username+"/"+req.params.id);
			}
	});
});

// Delete Route
app.delete("/blogs/:username/:id",function(req, res){
	req.params.username = username;
	Blog.findByIdAndRemove(req.params.id,function(err){
		if(err)
			{
				res.redirect("/blogs"+ username);
			}
		else
			{
				res.redirect("/blogs/"+username);
			}
	})
})
// User's route
// Show
app.get("/blogs/:username/users/:id",isLoggedIn,function(req, res)
{
	req.params.username = username;
	var blog_id = req.params.id;
	Blog.findById(blog_id,function(err, foundBlog){
		if(err)
			{
				console.log(err);
			}
		else
			{
				res.render("users/show",{blog: foundBlog,currentUser:req.user,id:username});
			}
	})
})
// Search users route
app.post("/blogs/:id/users",isLoggedIn,function(req, res){
	req.params.id = username;
    user = req.body.user;
	Blog.find({author:user},function(err,foundBlog){
		if(err)
		{
			console.log(err);
			
		}
		else
		{
			if (!Array.isArray(foundBlog) || !foundBlog.length) 
			{
				// array does not exist, is not an array, or is empty
				// ⇒ do not attempt to process array
				res.render("error",{currentUser:req.user,id:username});
			}
			else
			{
				res.render("users/index.ejs",{blog: foundBlog,currentUser:req.user,id:username,author:user});
			}
		}
	});
})
// ================
// AUTH ROUTES
// ================
// show registration form
app.get("/register",function(req, res)
{
	res.render("register",{currentUser:req.user,id:username});
});
// handle sign up logic
app.post("/register",function(req,res)
{
	var newUser = new User({username: req.body.username});
    User.register(newUser,req.body.password,function(err, user)
    {
		if(err)
			{
				console.log(err);
				return res.render("register",{currentUser:req.user,id:username});
			}
         passport.authenticate("local")(req, res, function()
        {
           res.redirect("/login");
        });
	});
});

// show login form
app.get("/login",function(req, res){
    res.render("login",{currentUser:req.user,id:username});
});
// handle login logic
app.post("/login",passport.authenticate("local",
{
failureRedirect: "/login",
}),function(req, res)
{
    username = req.body.username;
    res.redirect("/blogs/"+username);
});
// LOGOUT 
app.get("/logout",function(req, res)
{
	req.logout();
	res.redirect("/login");
});
// Logged in middleware
function isLoggedIn(req, res, next)
{
	if(req.isAuthenticated())
		{
			return next();
		}
		res.redirect("/login");	
		
}

// Starting the server
app.listen(3000,function()
{
    console.log("Server is running!");
})