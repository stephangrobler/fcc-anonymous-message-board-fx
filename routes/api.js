/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

const THREAD_COLLECTION = "threads";

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    .get(async (req, res) => {
      const db = await MongoClient.connect(process.env.DB);

      const threads = await db
        .collection(THREAD_COLLECTION)
        .find(
          { board: req.params.board },
          {
            delete_password: 0,
            "replies.delete_password": 0,
            "replies.reported": 0,
            replies: { $slice: -3 }
          }
        )
        .sort({ bumped_on: -1 })
        .limit(10)
        .toArray();

      db.close();
      res.json(threads);
    })
    .post(async (req, res) => {
      const db = await MongoClient.connect(process.env.DB);

      const created_on = new Date();

      const thread = {
        board: req.params.board,
        text: req.body.text,
        delete_password: req.body.delete_password,
        created_on,
        bumped_on: created_on,
        reported: false,
        replies: []
      };

      const response = await db.collection(THREAD_COLLECTION).insertOne(thread);
      const insertedThread = response.ops[0];
      db.close();
      res.redirect("/b/" + req.params.board);
    })
    .put(async (req, res) => {
      const thread_id = ObjectId(req.body.thread_id);

      const db = await MongoClient.connect(process.env.DB);
      const updated = await db
        .collection(THREAD_COLLECTION)
        .updateOne(
          { _id: ObjectId(req.body.thread_id) },
          { $set: { reported: true } }
        );
      res.json("success");
    })
    .delete(async (req, res) => {
      const thread_id = ObjectId(req.body.thread_id);
      const db = await MongoClient.connect(process.env.DB);

      const thread = await db
        .collection(THREAD_COLLECTION)
        .findOne({ _id: thread_id });

      if (!thread) {
        db.close();
        res.json("Not found");
      } else {
        if (thread.delete_password === req.body.delete_password) {
          const response = await db.collection(THREAD_COLLECTION).deleteOne({
            _id: thread_id,
            delete_password: req.body.delete_password
          });
          db.close();
          res.json("success");
        } else {
          db.close();
          res.json("incorrect password");
        }
      }
    });

  app
    .route("/api/replies/:board")
    .get(async (req, res) => {
      const db = await MongoClient.connect(process.env.DB);
      const thread_id = ObjectId(req.query.thread_id);

      const thread = await db.collection(THREAD_COLLECTION).findOne(
        { _id: thread_id },
        {
          fields: {
            reported: 0,
            delete_password: 0,
            "replies.delete_password": 0,
            "replies.reported": 0
          }
        }
      );
      db.close();
      res.json(thread);
    })
    .post(async (req, res) => {
      const db = await MongoClient.connect(process.env.DB);
      const thread_id = ObjectId(req.body.thread_id);
      const created_on = new Date();

      const reply = {
        _id: ObjectId(),
        board: req.params.board,
        text: req.body.text,
        delete_password: req.body.delete_password,
        created_on,
        reported: false
      };

      const repliedThread = await db
        .collection(THREAD_COLLECTION)
        .findOneAndUpdate(
          { _id: thread_id },
          {
            $set: { bumped_on: created_on },
            $push: {
              replies: reply
            }
          },
          {
            projection: {
              reported: 0,
              delete_password: 0,
              "replies.delete_password": 0,
              "replies.reported": 0
            },
            returnOriginal: false
          }
        );
      db.close();
      res.redirect("/b/" + req.params.board + "/" + repliedThread.value._id);
    })
    .put(async (req, res) => {
      const thread_id = ObjectId(req.body.thread_id);

      const db = await MongoClient.connect(process.env.DB);

      const thread = await db
        .collection(THREAD_COLLECTION)
        .findOne({ _id: thread_id });

      const replies = thread.replies.map(reply => {
        if (reply._id == req.body.reply_id) {
          reply = { ...reply, reported: true };
        }
        return reply;
      });
      await db
        .collection(THREAD_COLLECTION)
        .update({ _id: ObjectId(req.body.thread_id) }, { $set: { replies } });
      res.json("success");
    })
    .delete(async (req, res) => {
      const thread_id = ObjectId(req.body.thread_id);
      const db = await MongoClient.connect(process.env.DB);

      const thread = await db
        .collection(THREAD_COLLECTION)
        .findOne({ _id: thread_id });

      if (!thread) {
        db.close();
        res.json("Not found");
      } else {
        let replyIndex;
        const reply = thread.replies.find((reply, index) => {
          replyIndex = index;
          return reply._id == req.body.reply_id;
        });

        if (reply.delete_password === req.body.delete_password) {
          const first = thread.replies.slice(0, replyIndex);
          const second = thread.replies.slice(replyIndex + 1);
          const replies = [
            ...first,
            { ...reply, text: "[deleted]" },
            ...second
          ];
          await db
            .collection(THREAD_COLLECTION)
            .update(
              { _id: ObjectId(req.body.thread_id) },
              { $set: { replies } }
            );
          db.close();
          res.json("success");
        } else {
          db.close();
          res.json("incorrect password");
        }
      }
    });
};
