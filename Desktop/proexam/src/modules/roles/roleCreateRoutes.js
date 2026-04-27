const express=require("express")
const router=express.Router()
const { createRole, getRoles, getRole, updateRoleAndPermissions, userUpdateRole, deletingRole }=require("./roleCreateController")

//create new role
router.post("/roles",createRole)

//get all roles
router.get("/roles",getRoles)

// get role by id
router.get("/role/:roleId",getRole)

//add ,updatingand removing permissions to a role
router.patch("/roles/:roleId/updatepermissions",updateRoleAndPermissions)

//updating user role
router.patch("/roles/user/:userId",userUpdateRole)

//deleting a role
router.delete("/role/:roleId",deletingRole)


module.exports=router