import { type Request, type Response, type NextFunction } from "express";
import { type CustomRequest, type User } from "../libs/types.js";
import { users } from "../db/db.js";

// interface CustomRequest extends Request {
//   user?: any; // Define the user property
//   token?: string; // Define the token property
// }

export const checkRoleStudent = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. get "user payload" and "token" from (custom) request
  const payload = req.user;
  const token = req.token;
  const studentId = req.params.studentId;

  // 2. check if user exists (search with username) and role is 
  const user = users.find((u: User) => u.username === payload?.username);
  if (!user || user.role !== "STUDENT") {
    return res.status(401).json({
      success: false,
      message: "Forbidden access",
    });
  }

  // (optional) check if token exists in user data
   if(user.role === "STUDENT"&&user.studentId === studentId){
    console.log("STUDENT");
    return next();
  }

  // Proceed to next middleware or route handler
  return res.status(403).json({
    success: false,
    message: "Forbidden access",
  });
};