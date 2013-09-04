$(function() {
    // Initialize Parse SDK
    Parse.initialize(
        'Sal1JgAk0sGivZ6ZTCcyXQRD0PH9liu9dF0NIi89', 
        'InL6lqNZj7f2lxyyviocQeDZrbFZYSCORj2Goo8E'
    );

    // initialize app from the given user
    function initFromUser(user) {
        // get latest user data
        user.fetch({
            success: function(user) {
                // Set username
                $('#loggedInUser').html(user.get('username'));

                // Populate availability status
                if (!user.get('available')) {
                    $('input[name=available][value=no]').attr('checked',true);
                }

                // Generate a VoIP capability token
                Parse.Cloud.run('generateToken',null, {
                    success: function(token) {
                        // Configure our soft phone with a capability token which allows
                        // for incoming phone calls.
                        Twilio.Device.setup(token);
                    },
                    error: function(message) {
                        alert('token generation failed: '+message);
                    }
                });
            },
            error: function() {
                alert('problem fetching latest user data');
            }
        });
    }

    // Display login if we don't have a logged in user, otherwise display main
    // call center UI
    if (Parse.User.current()) {
        initFromUser(Parse.User.current());
        $('#main').fadeIn();
    } else {
        $('#login').fadeIn();
    }

    // Logic to handle the login form
    var $loginForm = $('#loginForm');
    $loginForm.submit(function(e) {
        e.preventDefault();
        Parse.User.logIn(
            $loginForm.find('input[type=text]').val(),
            $loginForm.find('input[type=password]').val(), 
            {
                success: function(user) {
                    // Set up user name for current user
                    initFromUser(user);

                    // Manipulate UI
                    $('#login').fadeOut(function() {
                        $('#main').fadeIn();
                        $loginForm.find('input[type=text]').val('');
                        $loginForm.find('input[type=password]').val('');
                    });
                },
                error: function() {
                    alert('sorry, couldn\'t log you in');
                }
            }
        );
    });

    // Logic to handle the call center agent UI
    $('#logout').on('click', function(e) {
        Parse.User.logOut();
        $('#main').fadeOut(function() {
            $('#login').fadeIn();
        });
    });

    // Handle the current state for the agent of this call center
    $('input[name=available]').change(function() {
        var available = $('input[name=available]:checked').val();
        var currentUser = Parse.User.current();
        currentUser.set('available', available === 'yes');
        currentUser.save(null, {
            success: function(user) {
                if (currentUser.get('available')) {
                    alert('You are now available to take calls.');
                } else {
                    alert('You are now unavailable.');
                }
            },
            error: function() {
                alert('There was an error updating your status.');
            }
        });
    });

    // Handle an inbound call in the browser
    Twilio.Device.incoming(function(connection) {
        // Accept the incoming call automatically
        connection.accept();

        // update status as busy
        var currentUser = Parse.User.current();
        currentUser.set('available', false);
        currentUser.save(null, {
            success: function(user) {
                // nothing for now
            },
            error: function() {
                alert('There was an error updating your status.');
            }
        });
    });
});