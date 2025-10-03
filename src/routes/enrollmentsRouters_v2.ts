import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest , Student , UserPayload, Enrollment } from "../libs/types.js";

// import database
import { users, reset_users, students , enrollments, courses } from "../db/db.js";
import { success } from "zod";
import { error } from "console";
import { 
    zStudentId ,
    zEnrollmentBody
 } from "../libs/zodValidators.js";

import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";
//import { checkRoleStudent } from "../middlewares/checkRoleStudentMiddleware.js";
import { checkRoleSAllrole } from "../middlewares/checkRoleAllroleMiddleware.js";

import { reset_enrollments } from "../db/db.js";
import { checkRoleStudent } from "../middlewares/checkRoleStudentMiddleware.js";
import { checkRoleStudentDELETE } from "../middlewares/checkRoleStudentMiddlewareDELETE.js";



const router = Router();

// GET /api/v2/enrollments
router.get("/", authenticateToken , checkRoleAdmin , (req: Request, res: Response) => {
    try{
        const group:any[] = [];

        enrollments.forEach((e)=>{
            let studentIdG = group.find((s)=>s.studentId === e.studentId);

            if(!studentIdG){
                studentIdG = { 
                    studentId: e.studentId,
                    courses:[]
                 };
                 group.push(studentIdG);
            }

            studentIdG.courses.push({ coursesId: e.courseId });
        }); 
    // return all users
        return res.json({
            success: true,
            message: "Enrollments Information",
            data: group, 
        });

    } catch(err){
        return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
        });
    }
});


// RESET /api/v2/enrollments/reset
router.post("/reset", authenticateToken , checkRoleAdmin , (req: Request, res: Response) => {
    try{
        reset_enrollments();

  res.status(200).json({
    success: true,
    message: "enrollments database has been reset.",
    //enrollments
  });

    } catch(err){
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: err
        });
    }
});

// GET /:studentId ---
router.get("/:studentId" , authenticateToken , checkRoleSAllrole, (req: Request, res: Response) => {
    try{
        const studentId = req.params.studentId;

        const student = students.find((s) => s.studentId === studentId);

        //console.log(student);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

    const studentCourses = enrollments
      .filter(e => e.studentId === studentId)
      .map(e => (e.courseId));
        
    // return all users
        return res.json({
            success: true,
            message: "Student Information",
            data:{
                studentId: student.studentId,
                firstName: student.firstName,
                lastName: student.lastName,
                program: student.program,
                courses: studentCourses,
            }
        });

    } catch(err){
        return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
        });
    }
});

//POST /:studentId
router.post("/:studentId", authenticateToken , checkRoleStudent , (req:Request,res:Response) => {
try{
    const reqStudentId = req.params.studentId!;
    const body = req.body as { courseId: string};

    const enrollmentInput = {
        studentId: reqStudentId,
        courseId: body.courseId,
    };
    
    const result = zEnrollmentBody.safeParse(enrollmentInput); // check zod

    console.log(result);

    if (!result.success ) {
      return res.json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    const checkEnroll = enrollments.find((s) => 
        s.studentId === enrollmentInput.studentId && 
        s.courseId === enrollmentInput.courseId
    );

    console.log(`foundCourseID = ${checkEnroll}`);

    if(checkEnroll){
        return res.status(409).json({
            success: false,
            message: "StudentId && courseId is already exists",
        });
    }

    // add new course
    const new_Enroll : Enrollment = {
        studentId: enrollmentInput.studentId,
        courseId: enrollmentInput.courseId,
    };
    enrollments.push(new_Enroll);

    // add response header 'Link'
    res.set("Link", `/:studentId/${new_Enroll.courseId}`);

    return res.status(201).json({
      success: true,
      message: `StudentId ${new_Enroll.studentId} && courseId ${new_Enroll.courseId} has been added successfuly`,
      data: new_Enroll,
    });
    
} catch(err){
        return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
        });
    }

});

//DELETE /:studentId
router.delete("/:studentId", authenticateToken , checkRoleStudentDELETE , (req:Request,res:Response) => {
try{
    const reqStudentId = req.params.studentId!;
    const body = req.body as { courseId: string};

    const enrollmentInput = {
        studentId: reqStudentId,
        courseId: body.courseId,
    };
    
    const result = zEnrollmentBody.safeParse(enrollmentInput); // check zod

    console.log(result);

    if (!result.success ) {
      return res.json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    const checkEnroll = enrollments.find((s) => 
        s.studentId === enrollmentInput.studentId && 
        s.courseId === enrollmentInput.courseId
    );

    console.log(`foundCourseID = ${checkEnroll}`);

    if(!checkEnroll){
        return res.status(409).json({
            success: false,
            message: "Enrollment does not exists",
        });
    }

    const foundIndex = enrollments.findIndex(
      (e) => e.studentId === enrollmentInput.studentId &&
      e.courseId === enrollmentInput.courseId
    );

    if (foundIndex === -1) {
      return res.json({
        success: false,
        message: "Enrollment does not exists",
      });
    }

    // delete found student from array
    enrollments.splice(foundIndex, 1);

    return res.status(201).json({
      success: true,
      message: `StudentId ${enrollmentInput.studentId} && courseId ${enrollmentInput.courseId} has been added successfuly`,
      data: [enrollments],
    });
    
} catch(err){
        return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
        });
    }

});




export default router;