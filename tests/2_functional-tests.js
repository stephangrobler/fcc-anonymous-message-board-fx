/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  let threadIdForDeletion,
    threadIdForReply,
    threadIdForReporting,
    replyIdForDeletion;

  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("New thread", done => {
        chai
          .request(server)
          .post("/api/threads/general")
          .type("form")
          .send({
            text: "testThreadText",
            delete_password: "testDeletePassword"
          })
          .end((err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Response should be 200");
            done();
          });
      });
      //
    });

    suite("GET", function() {
      test("Read message board", done => {
        chai
          .request(server)
          .get("/api/threads/general")
          .query()
          .end((err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Response status should be 200");
            threadIdForDeletion = res.body[3]._id;
            threadIdForReply = res.body[2]._id;
            threadIdForReporting = res.body[4]._id;
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("incorrect password", done => {
        chai
          .request(server)
          .delete("/api/threads/general")
          .type("form")
          .send({
            thread_id: threadIdForDeletion,
            delete_password: "testDeletePassword1"
          })
          .end((err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Status should be 200");
            assert.equal(
              res.text,
              '"incorrect password"',
              'Text "incorrect password" not received'
            );
            done();
          });
      });
      test("Delete thread successfully", done => {
        chai
          .request(server)
          .delete("/api/threads/general")
          .type("form")
          .send({
            thread_id: threadIdForDeletion,
            delete_password: "testDeletePassword"
          })
          .end((err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Status should be 200");
            assert.equal(res.text, '"success"', "No success message received");
            done();
          });
      });
      test("Thread not found", done => {
        chai
          .request(server)
          .delete("/api/threads/general")
          .type("form")
          .send({
            thread_id: threadIdForDeletion,
            delete_password: "testDeletePassword"
          })
          .end((err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Status should be 200");
            assert.equal(
              res.text,
              '"Not found"',
              'No "Not Found" message received'
            );
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Report thread", done => {
        chai
          .request(server)
          .put("/api/threads/general")
          .send({ thread_id: threadIdForReporting })
          .end(async (err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Response status should be 200");
            assert.equal(
              res.text,
              '"success"',
              'Response text should be "success"'
            );
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("New reply", done => {
        chai
          .request(server)
          .post("/api/replies/general")
          .type("form")
          .send({
            thread_id: threadIdForReply,
            text: "testReplyText",
            delete_password: "testDeleteReplyPassword"
          })
          .end((err, res) => {
            if (err) console.log(err);

            assert.isNotEmpty(res.redirects[0], "Page should redirect");
            done();
          });
      });
    });

    suite("GET", function() {
      test("Read specific thread", done => {
        chai
          .request(server)
          .get("/api/replies/general")
          .query({
            thread_id: threadIdForReply
          })
          .end((err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Response status should be 200");
            replyIdForDeletion = res.body.replies[0]._id;
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Report reply", done => {
        chai
          .request(server)
          .put("/api/replies/general")
          .send({ thread_id: threadIdForReply, reply_id: replyIdForDeletion })
          .end(async (err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Response status should be 200");
            assert.equal(
              res.text,
              '"success"',
              'Response text should be "success"'
            );
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("Reply incorrect password", done => {
        chai
          .request(server)
          .delete("/api/replies/general")
          .type("form")
          .send({
            thread_id: threadIdForReply,
            reply_id: replyIdForDeletion,
            delete_password: "testDeleteReplyPassword1"
          })
          .end((err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Status should be 200");
            assert.equal(
              res.text,
              '"incorrect password"',
              'Response text should be "incorrect password"'
            );
            done();
          });
      });
      test("Reply success", done => {
        chai
          .request(server)
          .delete("/api/replies/general")
          .type("form")
          .send({
            thread_id: threadIdForReply,
            reply_id: replyIdForDeletion,
            delete_password: "testDeleteReplyPassword"
          })
          .end((err, res) => {
            if (err) console.log(err);
            assert.equal(res.status, 200, "Status should be 200");
            assert.equal(
              res.text,
              '"success"',
              'Response text should be "incorrect password"'
            );
            done();
          });
      });
    });
  });
});
