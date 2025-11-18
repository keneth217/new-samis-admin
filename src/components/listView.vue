<template>
    <!-- staffs List View -->
    <div class="wrap">
      <div class="actions">
        <button @click="printStaffList">Print</button>
        <button @click="downloadStaffList">Download</button>
        <!-- <button @click="closeClassList">Close</button> -->
      </div>

      <div class="class-list">
        <header class="school-header">
        <img src="../components//icons/samis.png" alt="School Logo" class="school-logo"/>
        <div class="school-details">
          <h1>{{ schoolName }}</h1>
          <p>{{ schoolAddress }}</p>
          <p>{{ schoolContact }}</p>
        </div>
      </header>

      <section class="class-header">
        <h2>{{ currentYear }} - Staff List</h2>
      </section>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Image</th>
            <th>ID</th>
            <th>Name</th>
            <th>Department</th>
            
          </tr>
        </thead>
        <tbody>
          <tr v-for="(staff, index) in filteredStaff" :key="staff.id">
            <td>{{ index + 1 }}</td>
            <!-- Default image logic -->
            <td><img :src="staff.image || defaultAvatar" alt="staff Image" class="staff-image2" /></td>
            <td>{{ staff.id }}</td>
            <td>{{ staff.name }}</td>
            <td>{{ staff.department }}</td>
          </tr>
        </tbody>
      </table>
      </div>

      
    </div>
</template>

<script>

export default{
    components: {

    },
    data() {
    return {
      showForm: false,
      show: false,
      searchQuery: '',
      isCardView: true,
      staffList: [
        { id: 'T001', name: 'Alice Johnson', email: 'alice@example.com', phone: '+254701234567', department: 'Finance' },
        { id: 'T002', name: 'Bob Smith', email: 'bob@example.com', phone: '+254712345678', department: 'Security' }, // No image provided
        // Additional staffs...
      ],
      schoolName: 'Sample School',
      schoolAddress: '123 Sample Street, Nairobi, Kenya',
      schoolContact: 'Phone: +254712345678',
      currentYear: new Date().getFullYear(),
      defaultAvatar: 'src/assets/user-avatar.webp'  // Default avatar path
    };
  },
}

</script>

<style scoped>

/* List View Styles */
*{
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}
.wrap{
    margin-top: 4.5rem;
}
.class-list {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  font-family: 'Arial', sans-serif;
  color: #333;
}

.school-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.school-logo {
  height: 100px;
}

.school-details {
  text-align: right;
}

.school-details h1 {
  font-size: 24px;
  margin: 0;
  color: #1f2d57;
}

.school-details p {
  margin: 5px 0;
  font-size: 16px;
}

.class-header {
  text-align: center;
  margin-bottom: 20px;
}

.class-header h2 {
  font-size: 20px;
  margin: 0;
  color: #1f2d57;
}

.class-header p {
  font-size: 18px;
  margin: 5px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

thead th {
  background-color: #f2f2f2;
  text-align: left;
  padding: 10px;
  font-size: 16px;
  border-bottom: 2px solid #ddd;
}

tbody td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.staff-image {
  width: 20px;
  height: 180px;
  border-radius: 50%;
}

.staff-image2 {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.actions {
  display: flex;
  justify-content: flex-end;

  margin-right: 5.7rem; 
  padding-right: 5.7rem; 
  margin-bottom: .5rem;
}
.actions button {
  background-color: #f4f6fa;
  border: 2px solid #2b7ab7 !important;
  color: #2b7ab7;
  padding: 10px 20px;
  margin-left: 10px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: .2rem;
}

.actions button:hover {
  background-color: #2b7ab7;
  color: white;
}
</style>