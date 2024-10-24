// Defining provider
packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0, <2.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

//Variables declaration

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_id" {
  type    = string
  default = "vpc-0114f2d134aa756b4"
}
variable "subnet_id" {
  type    = string
  default = "subnet-0e55f8fd83d4ea499"
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "instance_type" {
  type    = string
  default = "t2.small"
}

variable "db_username" {
  type    = string
  default = "guest"
}

variable "db_password" {
  type    = string
  default = "password"
}

variable "db_name" {
  type    = string
  default = "webapp_db"
}

variable "port" {
  type    = number
  default = 3000
}

variable "host" {
  type    = string
  default = "127.0.0.1"
}

variable "dialect" {
  type    = string
  default = "postgres"
}

variable "demo_account_id" {
  type    = string
  default = "273354658804"
}

//Source block for ami
source "amazon-ebs" "my-ami" {
  ami_name        = "CSYE6225_AMI_webapp_${formatdate("YYYY_MM_DD-HH_mm_ss", timestamp())}"
  ami_description = "AMI for CSYE 6225 webapp - Assignment 4"
  ami_users       = [var.demo_account_id]

  region        = "${var.aws_region}"
  instance_type = "${var.instance_type}"
  ssh_username  = "${var.ssh_username}"
  subnet_id     = "${var.subnet_id}"
  ssh_timeout   = "10m"

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }

  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 25
    volume_type           = "gp2"
    delete_on_termination = true

  }

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }
}

//Build block with provisioners
build {
  name = "Build my AMI"
  sources = [
    "source.amazon-ebs.my-ami"
  ]

  //Shell Provisioner
  provisioner "shell" {
    script = "setup-script.sh"
  }

  //File provisioner
  provisioner "file" {
    source      = "./webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  provisioner "file" {
    source      = "./csye6225-aws.service"
    destination = "/tmp/csye6225-aws.service"
  }

  //Shell provisioner to set up the application
  provisioner "shell" {
    environment_vars = [
      "PORT= ${var.port}",
      "DB_DIALECT=${var.dialect}"
    ]
    script = "app-setup.sh"
  }
}