const Role = require("./modules/roleCreateModel")
const User = require("../../models/User")  //importing user model

//create new role
const createRole = async (req, res) => {
    const adminId = req.userDetails.id
    try {
        const { name, permissions } = req.body
        if (!name) {
            return res.status(400).json({ message: "Role name is required" })
        }
        const normalizedName = name.trim().toLowerCase().replace(/\s+/g, " ")
        //checking role existing or not
        const existingRole = await Role.findOne({ name: normalizedName, isDeleted: false })
        if (existingRole) return res.status(409).json({ message: "Role already exists" })
        //creating a role
        const role = await Role.create({ name: normalizedName, permissions, createdBy: adminId })
        return res.status(201).json({ message: "Role is created successfully", role })
    } catch (e) {
        return res.status(500).json({ message: "Role creation Failed", error: e.message })
    }
}

//get all roles
const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({ isDeleted: false }).select("name")
        return res.status(200).json({ message: "Roles fetched successfully", roles })
    } catch (e) {
        return res.status(500).json({ message: "Fetching roles failed", error: e.message })
    }
}

// get single role based on id
const getRole = async (req, res) => {
    try {
        const roleId = req.params.roleId
        const role = await Role.findOne({ _id: roleId, isDeleted: false })
        if (!role) return res.status(404).json({ message: "Role not found" })
        return res.status(200).json({ message: "Role fetched successfully", role })

    } catch (e) {
        return res.status(500).json({ message: "Fetching role failed", error: e.message })
    }
}

// updating permissions to existing role
const updateRoleAndPermissions = async (req, res) => {
    try {
        const { roleId } = req.params
        const { permissions } = req.body



        //finding existing role
        const role = await Role.findById(roleId)
        if (!role) return res.status(404).json({ message: "Role not found" })

        if (role.isDeleted) {
            return res.status(400).json({ message: "Cannot update a deleted role" })
        }

        //merging new permissions into existing permissions
        //adding , removing and updating permissions
        for (const key in permissions) {
            role.permissions.set(key, permissions[key])
        }

        //saving new changes
        await role.save()

        return res.status(200).json({ message: "Updated role and permission successfully", role })

    } catch (e) {
        return res.status(500).json({ message: "Updating role and permission failed", error: e.message })
    }
}

//update user role
const userUpdateRole = async (req, res) => {
    try {
        const { userId } = req.params
        const { roleId } = req.body

        // finding role with provided roleId
        const role = await Role.findOne({ _id: roleId, isDeleted: false })
        if (!role) return res.status(404).json({ message: "Role not found" })

        //updating user with new role
        const user = await User.findByIdAndUpdate(
            userId,
            { role: roleId },
            { new: true },

        ).populate("role")
        if (!user) return res.status(404).json({ message: "User not found" })

        //sending response
        return res.status(200).json({ message: "User role updated successfully", user })

    } catch (e) {
        return res.status(500).json({ message: "Updating user role failed", error: e.message })
    }
}


//deleting role.. soft delete
const deletingRole = async (req, res) => {
    const adminId = req.userDetails.id
    try {
        const { roleId } = req.params

        // finding role
        const role = await Role.findOne({ _id: roleId, isDeleted: false })
        if (!role) return res.status(404).json({ message: "Role not found" })

        //how many users has with that role
        const usersCount = await User.countDocuments({ role: roleId })
        if (usersCount > 0) return res.status(400).json({ message: "Role is assigned to employee and cannot be deleted" })


        //who deleted
        role.deletedBy = adminId

        // soft deleting role
        role.isDeleted = true
        role.deletedAt = new Date()
        await role.save()

        return res.status(200).json({ message: "Role deleted successfully" })
    } catch (e) {
        return res.status(500).json({ message: "Deleting role failed", error: e.message })
    }
}




module.exports = { createRole, getRoles, getRole, updateRoleAndPermissions, userUpdateRole, deletingRole }