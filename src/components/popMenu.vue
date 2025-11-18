<template>
    <div class="wrap">
        <div class="msg-body" :style="{ borderColor: borderColor }">
            <h2> {{ message }} </h2>
        </div>
    </div>
</template>

<script>

export default{
    props: {
        message: String,
        borderColor: {
            type: String,
            default: 'gold'
        }
    }
}
</script>

<style scoped>
*{
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}
.wrap{
    background-color: rgba(17, 167, 167, 0.5);
    width: 100%;
    height: 100%;
    z-index: 5000;
    right: 0;
    left: 0;
    bottom: 0;
    top: 0;
    position: fixed;
}

.msg-body{
    padding: 30px;
    background-color: #4368b9;
    color: white;
    /* left: 0;
    right: 0; */
    text-align: center;
    width: 25rem;
    margin: auto;
    margin-top: 300px;
    border-radius: .5rem;
    /* box-shadow: 0px 0px 5px red; */
    border: 2px solid;
    /* font-family: ui-monospace; */
}
</style>