import mongoose from "mongoose";

const mongoUrl =
  "mongodb+srv://shreyasmohanty03:shreyasmohanty03@cluster0.o3psyzc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

export const connectToDB = async () => {
  try {
    if (typeof mongoUrl === "undefined") {
      throw new Error("MongoDB url is undefined");
    }
    await mongoose.connect(mongoUrl);
  } catch (error) {
    console.log(error);
  }
};
