const isAdmin = (req, res, next) => {
    if (req.session.admin) {
      res.locals.admin = req.session.admin;
      next();
    }
    else{
        return res.redirect('/admin');
    }
  };
  
  module.exports = { isAdmin };