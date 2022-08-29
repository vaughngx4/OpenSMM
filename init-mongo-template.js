db.createUser(
    {
        user  : "opensmm",
        pwd   : "opensmm",
        roles : [
          {
              role : "readWrite",
              db   : "opensmm"
          }
        ]
    }
)
