'use strict';

import * as express from 'express';
const router = express.Router();
const uuidV4 = require('uuid/v4');

import * as path from 'path';
import * as fs from 'fs';
import * as moment from 'moment';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import * as multer from 'multer';
import * as mysql from 'mysql';
import Knex = require('knex');

import { UploadModel } from "../models/upload";

const uploadModel = new UploadModel();
const uploadDir = process.env.UPLOAD_DIR;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    let _ext = path.extname(file.originalname);
    let document_id = uuidV4();
    cb(null, document_id + _ext)
  }
})

let upload = multer({ storage: storage })

router.post('/', upload.any(), (req, res, next) => {
  fse.ensureDirSync(uploadDir);

  let document_code = `${req.body.document_code}`;
  let comment = req.body.comment;

  let db = req.db;
  let files = req.files;
  let docs: any = [];

  files.forEach(v => {
    let fileData = fs.readFileSync(v.path);
    let uploaded_at = moment().format('x');
    let document_id = uuidV4();
    let obj = {
      document_id: document_id,
      document_code: document_code,
      file_name: v.filename,
      originalname: v.originalname,
      file_path: v.path,
      file_size: v.size,
      mime_type: v.mimetype,
      comment: comment,
      uploaded_at: uploaded_at
    };
    docs.push(obj);
  });

  if (docs.length) {
    uploadModel.saveUpload(db, docs)
      .then((ids) => {
        res.send({ ok: true, files: docs });
      })
      .catch((error) => {
        res.send({ ok: false, error: error });
      })
      .finally(() => {
        db.destroy();
      });
  } else {
    res.send({ ok: false, error: 'No file upload!' });
  }
});

router.get('/info/:documentCode', (req, res, next) => {
  let documentCode = req.params.documentCode;
  let db = req.db;
  uploadModel.getFiles(db, documentCode)
    .then((rows) => {
      let files: any = [];
      rows.forEach(v => {
        files.push({
          document_id: v.document_id,
          document_code: v.document_code,
          originalname: v.originalname,
          file_name: v.file_name,
          comment: v.comment,
          uploaded_at: moment(v.uploaded_at, 'x').format('YYYY-MM-DD HH:mm:ss')
        });
      })
      res.send({ ok: true, rows: files[0] });
    })
    .catch((error) => {
      res.send({ ok: false, error: error });
    })
    .finally(() => {
      db.destroy();
    });
});

router.delete('/:documentId', (req, res, next) => {
  let documentId = req.params.documentId;
  let db = req.db;

  uploadModel.getFileInfo(db, documentId)
    .then((rows) => {
      if (rows.length) {
        uploadModel.removeFile(db, documentId)
          .then(() => {
            let filePath = rows[0].file_path;
            rimraf.sync(filePath);
            res.send({ ok: true });
          })
          .catch(error => {
            res.send({ ok: false, error: error });
          })
          .finally(() => {
            db.destroy();
          })
      } else {
        res.send({ ok: false, error: 'ไม่พบไฟล์ที่ต้องการลบ' })
      }
    })
    .catch((error) => {
      res.send({ ok: false, error: error });
    });
});

router.get('/files/:documentId', (req, res, next) => {
  let documentId = req.params.documentId;
  let db = req.db;
  uploadModel.getFileInfo(db, documentId)
    .then((rows) => {
      if (rows.length) {
        let file = rows[0].file_path;
        let filename = path.basename(file);
        let mimetype = rows[0].mime_type;

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mimetype);

        let filestream = fs.createReadStream(file);
        filestream.pipe(res);
      } else {
        res.send({ ok: false, error: 'File not found!' })
      }
    })
    .catch((error) => {
      res.send({ ok: false, error: error });
    })
    .finally(() => {
      db.destroy();
    });
});

export default router;
