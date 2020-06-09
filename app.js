const cookieParser = require('cookie-parser');
const express = require('express');
const logger = require('morgan');
const path = require('path');

// const indexRouter = require('./routes/index');
const mapRouter = require('./routes/mapRouter');

const app = express();
app.set('view engine', 'pug')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
app.use('/', mapRouter);

module.exports = app;
