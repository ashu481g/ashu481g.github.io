/* Yoga page content. Edit this file only to change videos, audio or books.
   Drive IDs come from the share link: drive.google.com/file/d/<ID>/view */

/* Weekly classes: one per weekday. Order must stay Sunday ... Saturday. */
const SESSIONS = [
  { day: "Sunday",    title: "Face Yoga by Kashish Makhijani", id: "1KFa6751b46YLq7Ch-I8tNupXhB2WZOPI" },
  { day: "Monday",    title: "Light Yoga & Breathing",         id: "1bGaAw8qS3PJLrAtaynHA5d5sJVngn2ej" },
  { day: "Tuesday",   title: "Lower Body",                     id: "1hJBJhwe2yrPlJZXXULcbvvMZMl3K4LQU" },
  { day: "Wednesday", title: "Upper Body",                     id: "1Mwwt3Qn_GWSQ7S9GyEsDYxjG0fE2P7ha" },
  { day: "Thursday",  title: "Core & Laughter",                id: "1kyuIp2IkECr4eWZrZmgKA_AeluX9w45r" },
  { day: "Friday",    title: "Flexibility",                    id: "1oh20L96CNaZfhOEGGLFZwamrQ2lAhQ7b" },
  { day: "Saturday",  title: "Stamina & Meditation",           id: "1PCgFgZSk044CqAelcSozR9LB-jKaDYpx" }
];

/* Breathing & Pranayam list and Books list.
   Paste the output of the Google Apps Script over these two lists.
   For audio repeats to work reliably, also put a copy of the audio file in yoga/audio/
   with exactly the same file name. */
const BREATHING = [
 {
  "name": "4-7-8-breathing-timer-breathingmeditation.mp3",
  "id": "1Z6D8uPrlynrv3KkbORqWp8IY5k6lCeJC",
  "kind": "audio"
 },
 {
  "name": "PRANAYAM COUNTS IN HINDI ART OF LIVING.m4a",
  "id": "1OEwKq_FsdEb_uwWdrUuVMDzLPNP_r3fQ",
  "kind": "audio"
 },
 {
  "name": "Special Breathing Session ‪@saurabhbothra.mp4",
  "id": "1jq2QioEfndRlC-upSg3HWm2ZLri3OcDc",
  "kind": "video"
 }
];
const PDFS = [
 {
  "name": "Diabetes Reversal Recipe Handbook.pdf",
  "id": "1eoEWU1W4IJfWtKmdneXGBrYu9h6OuYN9"
 },
 {
  "name": "freeyoga_Prakriti_handbook.pdf",
  "id": "1tjvLcU3994FUIdUv1ShCJcd5JDcuEYWh"
 },
 {
  "name": "Habuild Pranayama Handbook.pdf",
  "id": "1HE85wSPdQnnFTxcGTwoACVJE1VcyNAre"
 },
 {
  "name": "Habuild Yoga Handbook.pdf",
  "id": "1dN27ehD57xQRI-kt9jusT10UbVKZTtHe"
 },
 {
  "name": "Immunity Booster recipe Handbook.pdf",
  "id": "1YlCH7eoI30d8sFQiT0cB7PUP4JZSKhCD"
 },
 {
  "name": "Millets Handbook.pdf",
  "id": "10sWRi2XjrchlPaN7CiRmRfRY5HMFYJTD"
 },
 {
  "name": "Recovery_Drinks_Handbook.pdf",
  "id": "1VibcrWW1OkwHU0x_LSKiRY014lbZ1Edk"
 },
 {
  "name": "Summer Drinks Handbook.pdf",
  "id": "15h15Emq8FWGMODrOpH3vVlFxbkOOCRZv"
 },
 {
  "name": "Summer Skincare Recipe.pdf",
  "id": "1hVahztBNHC4wRS7DKiiM9Aoy6Vv3elWV"
 }
];
