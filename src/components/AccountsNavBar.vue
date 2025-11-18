<template>
    <div class="accounts">
        <div class="accountsHeader">
              <h1>Accounts</h1>
        </div>
        <div class="accounts-content">
            
                <router-link
                    v-for="(button, index) in buttons"
                    :key="index"
                    :to="getRoutePath(index)"
                    class="router-link-custom"
                    :class="{ 'active': activeButton === index }"
                    @click="setActiveButton(index)"
                    >
                    <button>{{ button }}</button>
                </router-link>
                <!-- <router-link :to="getRoutePath(activeButton)" class="router-link-custom">
                        <button>{{ buttons[activeButton] }}</button>
                </router-link> -->
        
        </div>
        
    </div>
</template>

<script>

import Expenses from '../views/Expenses.vue'

export default{
    components: { Expenses },
    data(){
        return {
            buttons: ['PAYROLL', 'EXPENSES', 'SALES', 'PAYOUT', 'SAVINGS', 'LOANS'],
            activeButton: -1,
        }
    },
    methods: {
        setActiveButton(index){
            this.activeButton = index;
        },
        getRoutePath(index){
            const routes = [
                
                // {
                //     path: '/Expenses',
                //     component: Expenses
                // }
                '/Payroll',
                '/Expenses',
                '/Sales',
                '/Payout',
                '/Savings',
                '/Loans',
            ];
            return routes[index];
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

.active{
    background-color: teal;
    color: white;
    box-shadow: 0px 0px 5px red;
}
.accounts{
    /* padding-top: .5rem;
    padding-left: 4rem; */
    padding-left: 2rem;
    padding-top: 2.5rem;
}
.accountsHeader{
    color: teal;
}
.accounts-content{
    display: flex;
    gap: 1rem;

}
button{
    padding: .5rem;
    background-color: white;
    color: teal;
    border-radius: 8px;
    width: 10rem;
    font-size: larger;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0px 0px 5px teal;
    cursor: pointer;
    text-decoration: none;
}
button:hover{
    background-color: teal;
    color: white;
}
/* .router-link-custom{
    text-decoration: none;
    /* color: gold; 
    
} */
/* .router-link-custom:hover{
    background-color: teal;
    color: white !important;
} */

</style>








<!-- <template>
    <div class="accounts">
        <div class="accounts-content">
        
        </div>
        
    </div>
</template>

<script>
// import AccountsNavBar from '../components/AccountsNavBar.vue';

export default{
    components: {  },
    data(){
        return {
            
        }
    },
    methods: {
       




    }

}
</script>

<style scoped>
*{
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}

.active{
    background-color: teal;
    color: white;
    box-shadow: 0px 0px 5px red;
}
.accounts{
    padding-top: 4rem;
    padding-left: 4rem;
    height: 100%;
    width: 100%;
}
.accounts-content{
    display: flex;
    gap: 1rem;

}
button{
    padding: .5rem;
    background-color: white;
    color: teal;
    border-radius: 8px;
    width: 10rem;
    font-size: larger;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0px 0px 5px teal;
}

</style> -->