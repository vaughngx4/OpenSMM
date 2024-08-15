db.createUser({
  user: "REF_USER",
  pwd: "REF_PASS",
  roles: [
    {
      role: "readWrite",
      db: "REF_DB",
    },
  ],
});
