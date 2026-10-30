import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://prjptsumeet_db_user:Sumit4106@cluster0.0nbht04.mongodb.net/Project_sem_6')
    .then(() => console.log("DB CONNECTED"))
}