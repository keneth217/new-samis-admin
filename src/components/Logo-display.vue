<template>
    <div class="logo-container">
        <div class="logo-image-container">
            <img :src="logoSrc" alt="Logo" class="logo-image">  
        <!-- </div> -->

        <div class="upload-section">
            <input type="file" @change="handleLogoChange" class="upload-input" id="upload-icon">
            <label for="upload-icon" class="upload-icon-label">
                <i class="fas fa-image"></i>
            </label>
        </div>

        
    </div>
    </div>
</template>

<script>

export default{

    data(){
        return {
            // /home/naina/PROJECTS/DAIRY-MIS/src/components/icons/samis.png
            logoSrc: 'src/components/icons/samis.png'
        }
    },
    methods: {
        handleLogoChange(event){
            const file = event.target.files[0];
            if(file){
                const reader = new FileReader();
                reader.onload = () => {
                    this.logoSrc = reader.result;
                };
                reader.readAsDataURL(file);
            }
        }




    }
};
</script>

<style scoped>
*{
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}

.logo-container{
    display: flex;
    flex-direction: column;
    margin-top: 6rem !important;
    align-items: center;
    margin: 20px;
}

.logo-image-container{
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #ddd;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.logo-image{
    max-width: 65%;
    height: auto;
    border-radius: 50rem;
}
.upload-section{
    display: flex;
    flex-direction: column;
    align-items: center;

}
.upload-input{
    display: none;
}
.upload-icon-label{
    margin-top: 6rem;
    padding: 2px 4px;
    /* background-color: aqua; */
    color: gold;
    cursor: pointer;
    border-radius: 4px;

}


</style>