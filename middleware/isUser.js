const isUser = (req, res, next) => {
    if (req.session.user) {
      res.locals.user = req.session.user;
      next();
    }
    else{
        return res.redirect('/login');
    }
  };
  
  module.exports = isUser ;