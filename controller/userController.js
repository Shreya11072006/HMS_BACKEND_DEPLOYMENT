import { catchAsyncErrors} from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/userSchema.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";


export const patientRegister = catchAsyncErrors(async (req, res, next) =>{
    const {firstName,lastName,email,phone,password,gender,dob,nic,role} = req.body;
    if(!firstName||
       !lastName||
       !email||
       !phone||
       !password||
       !gender||
       !dob||
       !nic||
       !role
    ){
       return next(new ErrorHandler("Please Fill Full Form!", 400));
    }
    let user = await User.findOne({ email });
    if (user){
        return next(new ErrorHandler("User Already Registered!", 400));
    }

    user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        gender,
        dob,
        nic,
        role,
    });
    generateToken(user,"User Registered!",200,res);
});

export const login = catchAsyncErrors(async (req, res, next) =>{
const {email,password,confirmPassword,role} = req.body;
if(!email || !password || !confirmPassword || !role){
return next(new ErrorHandler("Please Provide All Details!", 400));
}
if (password !== confirmPassword) {
    return next(new ErrorHandler("Password & Confirm Password Do Not Match!", 400));
  }
  const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid Email Or Password!", 400));
    }
  const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid Email Or Password!", 400));
    }
  if (role !== user.role) {
      return next(new ErrorHandler(`User Not Found With This Role!`, 400));
    }
    generateToken(user,"User Login Successfully!",200,res);
});

export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {

  //Extract details from req body
  const { firstName, lastName, email, phone, nic, dob, gender, password } = req.body;

  //fill full form
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !password
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  //Check already registered admin
  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler(`${isRegistered.role} With This Email Already Exists!`));
  }

  //Create new admin entry in DB
  const admin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Admin",
  });
  res.status(200).json({
    success: true,
    message: "New Admin Registered!",
    
  });
});

export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctors = await User.find({ role: "Doctor" });
  res.status(200).json({
    success: true,
    doctors,
  });
});

export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("adminToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: true,
      sameSite: "None",
    })
    .json({
      success: true,
      message: "Admin Logged Out Successfully!",
    });
});

export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("patientToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: true,
      sameSite: "None",
  })
    .json({
      success: true,
      message: "Patient Logged Out Successfully!",
    });
});

export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  
  //check avatar len if(len==0) Avatar required
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Doctor Avatar Required!", 400));
  }
  const { docAvatar } = req.files;

  //Allowed formats : .png, .jpeg, .webp
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype)) {
    return next(new ErrorHandler("File Format Not Supported!", 400));
  }

  //Extract deatils from req body
  const {
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    doctorDepartment,
  } = req.body;

  //Fill full form
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !nic ||
    !dob ||
    !gender ||
    !password ||
    !doctorDepartment
  ) {
    return next(new ErrorHandler("Please Provide Full Details!", 400));
  }

  //Check already registered mail
  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(
      new ErrorHandler(`${isRegistered.role} already registered with this email`, 400)
    );
  }

  //Upload avatar to cloudinary
  const cloudinaryResponse = await cloudinary.uploader.upload(
    docAvatar.tempFilePath
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponse.error || "Unknown Cloudinary error"
    );
   }

  //Create entry for doctor in DB
  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Doctor",
    doctorDepartment,
    docAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,   //Store avatar URL in DB
    },
  });
  res.status(200).json({
    success: true,
    message: "New Doctor Registered!",
    doctor,
  });
});