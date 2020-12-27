source /home/ec2-user/.bash_profile
whereis node

if [ "$DEPLOYMENT_GROUP_NAME" == "sn-aws-bootcamb-BE-Live-GN" ]
then
   echo 'executes the steps to deploy on Live-instances'
    # rm /folders/configs/sn-aws-bootcamb.json
    # cd /folders/configs
    yes | cp /folders/exe/sn-aws-bootcamb/envConfig/live/sn-aws-bootcamp.json /folders/configs/
elif [ "$DEPLOYMENT_GROUP_NAME" == "sn-aws-bootcamb-BE-Dev-GN" ]
then
   echo 'executes the steps to deploy on Dev-instances'
    # rm /folders/configs/coatconnect-user.json
    yes | cp /folders/exe/sn-aws-bootcamb/envConfig/dev/sn-aws-bootcamp.json /folders/configs/
else
    echo 'group name doesnot exist'
fi

# restart api service
pm2 restart user-api