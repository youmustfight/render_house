module.exports = {
  "DATABASE_URI": "mongodb://localhost:27017/fsg-app",
  "SESSION_SECRET": "Optimus Prime is my real dad",
  "TWITTER": {
    "consumerKey": "INSERT_TWITTER_CONSUMER_KEY_HERE",
    "consumerSecret": "INSERT_TWITTER_CONSUMER_SECRET_HERE",
    "callbackUrl": "INSERT_TWITTER_CALLBACK_HERE"
  },
  "FACEBOOK": {
    "clientID": "414224232096019",
    "clientSecret": "2ca8a900166df5d62e441a2de061a316",
    "callbackURL": "http://localhost:1337/auth/facebook/callback"
  },
  "GOOGLE": {
    "clientID": "353800858718-9fhlssuleqd3m8ede7eu8lsjahc48ovp.apps.googleusercontent.com",
    "clientSecret": "6banHHSWNzn8lrdLX5mItu95",
    "callbackURL": "http://renderhouse.io/auth/google/callback"
  }
};