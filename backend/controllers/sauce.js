const Sauce = require("../models/sauce");
const fs = require("fs");
const Joi = require("joi");

const schema = Joi.object({
  name: Joi.string().alphanum().min(2).max(30),
  manufacturer: Joi.string().alphanum().min(2).max(30),
  description: Joi.string().alphanum().min(2).max(30),
  mainPepper: Joi.string().alphanum().min(2).max(30),
});

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  sauceObject.likes = 0;
  sauceObject.dislikes = 0;
  sauceObject.usersLiked = [];
  sauceObject.usersDisliked = [];

  const { error } = schema.validate({
    name: sauceObject.name,
    manufacturer: sauceObject.manufacturer,
    description: sauceObject.description,
    mainPepper: sauceObject.mainPepper,
  });

  if (error == undefined) {
    const sauce = new Sauce({
      ...sauceObject,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    });
    sauce
      .save()
      .then(() => res.status(201).json({ message: "Objet enregistré !" }))
      .catch((error) => res.status(400).json({ error }));
  } else {
    return res.status(400).json({ message: error.details[0].message });
  }
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  Sauce.updateOne(
    { _id: req.params.id },
    { ...sauceObject, _id: req.params.id }
  )
    .then(() => res.status(200).json({ message: "Objet modifié !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauces) => {
      const filename = sauces.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Objet supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.likeSauce = (req, res, next) => {
  let like = req.body.like;
  let userId = req.body.userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauceOK) => {
      if (like == 1) {
        sauceOK.usersLiked.push(userId);
        sauceOK.likes += 1;
      }
      if (like == 0) {
        sauceOK.usersDisliked = sauceOK.usersDisliked.filter(
          (el) => el != userId
        );
        sauceOK.usersLiked = sauceOK.usersLiked.filter((el) => el != userId);
        sauceOK.likes = sauceOK.usersLiked.length;
        sauceOK.dislikes = sauceOK.usersDisliked.length;
      }
      if (like == -1) {
        sauceOK.usersDisliked.push(userId);
        sauceOK.dislikes += 1;
      }
      Sauce.updateOne({ _id: req.params.id }, sauceOK)

        .then(() => res.status(200).json({ message: "Objet modifié !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
